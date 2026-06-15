package com.desk.ticket.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.desk.ticket.dto.GeminiTriageResult;
import com.desk.ticket.entity.Category;
import com.desk.ticket.entity.Priority;
import com.desk.ticket.entity.Department;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiClassifierService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public GeminiClassifierService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public GeminiTriageResult triageDescription(String description) {
        log.debug("Triaging ticket description: {}", description);

        // Fallback checks
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("dummy_api_key_for_testing")) {
            log.warn("Gemini API key is not configured or is dummy. Falling back to local rule-based classifier.");
            return getLocalPrediction(description);
        }

        try {
            String url = apiUrl + "?key=" + apiKey;

            // Build request prompt
            String promptText = String.format(
                    "You are an AI engine for an Enterprise IT Service Desk Ticket Management System.\n" +
                    "Analyze the given ticket description and return ONLY valid JSON (no explanations, no markdown).\n" +
                    "Your task is to:\n" +
                    "1. Classify the ticket category\n" +
                    "2. Predict the correct support department\n" +
                    "3. Assign priority level\n" +
                    "4. Identify required engineer skill set\n" +
                    "5. Provide root cause analysis\n" +
                    "6. Generate 3–5 step-by-step troubleshooting resolution steps\n" +
                    "7. Suggest workload-based assignment hint (type of engineer suitable: low load / medium load / senior engineer)\n\n" +
                    "Valid categories:\n" +
                    "Hardware, Software, Network, Security, Database, Infrastructure, Access Management, Application Support, Other\n\n" +
                    "Valid departments:\n" +
                    "IT_SUPPORT, NETWORK_TEAM, SECURITY_TEAM, DATABASE_TEAM, INFRASTRUCTURE_TEAM, APPLICATION_SUPPORT\n\n" +
                    "Priority levels:\n" +
                    "LOW, MEDIUM, HIGH, CRITICAL\n\n" +
                    "Return JSON in this exact format:\n" +
                    "{\n" +
                    "  \"category\": \"\",\n" +
                    "  \"department\": \"\",\n" +
                    "  \"priority\": \"\",\n" +
                    "  \"engineerSkill\": \"\",\n" +
                    "  \"rootCause\": \"\",\n" +
                    "  \"assignmentHint\": \"\",\n" +
                    "  \"aiResolution\": [\n" +
                    "    \"\",\n" +
                    "    \"\",\n" +
                    "    \"\",\n" +
                    "    \"\"\n" +
                    "  ]\n" +
                    "}\n\n" +
                    "Ticket description:\n" +
                    "\"%s\"",
                    description.replace("\"", "\\\"")
            );

            // Construct Gemini Request JSON
            Map<String, Object> requestBody = new HashMap<>();
            
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", promptText);
            
            Map<String, Object> partsContainer = new HashMap<>();
            partsContainer.put("parts", List.of(textPart));
            
            requestBody.put("contents", List.of(partsContainer));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.debug("Sending POST request to Gemini API for triage...");
            String responseStr = restTemplate.postForObject(url, entity, String.class);
            log.debug("Received response from Gemini: {}", responseStr);

            if (responseStr != null) {
                JsonNode rootNode = objectMapper.readTree(responseStr);
                JsonNode textNode = rootNode.path("candidates").get(0)
                        .path("content").path("parts").get(0).path("text");

                String resultJsonStr = textNode.asText().trim();
                log.debug("Parsed raw result text from Gemini: {}", resultJsonStr);

                // Sanitize/clean markdown block quotes if returned
                if (resultJsonStr.startsWith("```")) {
                    int firstNewLine = resultJsonStr.indexOf('\n');
                    if (firstNewLine != -1) {
                        resultJsonStr = resultJsonStr.substring(firstNewLine + 1);
                    }
                    if (resultJsonStr.endsWith("```")) {
                        resultJsonStr = resultJsonStr.substring(0, resultJsonStr.length() - 3);
                    }
                    resultJsonStr = resultJsonStr.trim();
                }

                JsonNode resultJson = objectMapper.readTree(resultJsonStr);
                String categoryStr = resultJson.path("category").asText().toUpperCase().trim().replace(" ", "_");
                String departmentStr = resultJson.path("department").asText().toUpperCase().trim();
                String priorityStr = resultJson.path("priority").asText().toUpperCase().trim();
                String engineerSkill = resultJson.path("engineerSkill").asText().trim();
                String rootCause = resultJson.path("rootCause").asText().trim();
                String assignmentHint = resultJson.path("assignmentHint").asText().trim();

                // Validate and map Category Enum with fallback
                Category category = Category.OTHER;
                for (Category cat : Category.values()) {
                    if (cat.name().replace("_", "").equalsIgnoreCase(categoryStr.replace("_", ""))) {
                        category = cat;
                        break;
                    }
                }

                // Validate and map Department Enum with fallback
                Department department = Department.IT_SUPPORT;
                for (Department dept : Department.values()) {
                    if (dept.name().replace("_", "").equalsIgnoreCase(departmentStr.replace("_", ""))) {
                        department = dept;
                        break;
                    }
                }

                // Validate and map Priority Enum with fallback
                Priority priority = Priority.LOW;
                try {
                    priority = Priority.valueOf(priorityStr);
                } catch (Exception e) {
                    log.warn("Invalid priority parsed: '{}'. Falling back to LOW", priorityStr);
                }

                // Clean string defaults
                if (engineerSkill.isEmpty()) engineerSkill = getLocalEngineerSkill(category);
                if (rootCause.isEmpty()) rootCause = "Pending diagnosis by assigned support team.";
                if (assignmentHint.isEmpty()) assignmentHint = "IT Service Desk general queue assignment.";

                // Parse AI resolutions array
                List<String> aiResolution = new java.util.ArrayList<>();
                JsonNode resArrayNode = resultJson.path("aiResolution");
                if (resArrayNode.isArray()) {
                    for (JsonNode node : resArrayNode) {
                        if (!node.asText().trim().isEmpty()) {
                            aiResolution.add(node.asText().trim());
                        }
                    }
                }
                if (aiResolution.isEmpty()) {
                    aiResolution = getLocalResolutionSteps(category);
                }

                return GeminiTriageResult.builder()
                        .category(category.name())
                        .department(department.name())
                        .priority(priority.name())
                        .engineerSkill(engineerSkill)
                        .rootCause(rootCause)
                        .assignmentHint(assignmentHint)
                        .aiResolution(aiResolution)
                        .build();
            }
        } catch (Exception e) {
            log.error("Error calling Gemini API or parsing response: {}. Falling back to rule-based classification.", e.getMessage());
        }

        return getLocalPrediction(description);
    }

    public GeminiTriageResult getLocalPrediction(String description) {
        Category category = predictCategoryLocal(description);
        Department department = predictDepartmentLocal(category, description);
        Priority priority = predictPriorityLocal(description);
        
        String engineerSkill = getLocalEngineerSkill(category);
        String rootCause = "Local keyword-match heuristics flagged this issue under " + category.name() + " / " + department.name() + ".";
        String assignmentHint = priority == Priority.CRITICAL || priority == Priority.HIGH ? "Senior engineer / High load priority" : "Regular queue / Low-Medium load";
        List<String> aiResolution = getLocalResolutionSteps(category);

        return GeminiTriageResult.builder()
                .category(category.name())
                .department(department.name())
                .priority(priority.name())
                .engineerSkill(engineerSkill)
                .rootCause(rootCause)
                .assignmentHint(assignmentHint)
                .aiResolution(aiResolution)
                .build();
    }

    public Category predictCategoryLocal(String description) {
        if (description == null) return Category.OTHER;
        String descLower = description.toLowerCase();
        if (descLower.contains("vpn") || descLower.contains("wifi") || descLower.contains("internet") || descLower.contains("network") || descLower.contains("connectivity")) {
            return Category.NETWORK;
        } else if (descLower.contains("password") || descLower.contains("login") || descLower.contains("reset") || descLower.contains("lockout") || descLower.contains("account") || descLower.contains("access") || descLower.contains("unauthorized")) {
            return Category.ACCESS_MANAGEMENT;
        } else if (descLower.contains("security") || descLower.contains("hack") || descLower.contains("firewall") || descLower.contains("leak") || descLower.contains("threat")) {
            return Category.SECURITY;
        } else if (descLower.contains("database") || descLower.contains("sql") || descLower.contains("postgres") || descLower.contains("mongodb") || descLower.contains("oracle") || descLower.contains("db")) {
            return Category.DATABASE;
        } else if (descLower.contains("server") || descLower.contains("aws") || descLower.contains("cloud") || descLower.contains("infrastructure") || descLower.contains("vm") || descLower.contains("host")) {
            return Category.INFRASTRUCTURE;
        } else if (descLower.contains("install") || descLower.contains("software") || descLower.contains("app") || descLower.contains("application") || descLower.contains("excel") || descLower.contains("bug") || descLower.contains("crash")) {
            return Category.APPLICATION_SUPPORT;
        } else if (descLower.contains("laptop") || descLower.contains("keyboard") || descLower.contains("monitor") || descLower.contains("mouse") || descLower.contains("printer") || descLower.contains("hardware") || descLower.contains("device")) {
            return Category.HARDWARE;
        }
        return Category.OTHER;
    }

    public Department predictDepartmentLocal(Category category, String description) {
        if (category == null) return Department.IT_SUPPORT;
        switch (category) {
            case NETWORK:
                return Department.NETWORK_TEAM;
            case ACCESS_MANAGEMENT:
            case SECURITY:
                return Department.SECURITY_TEAM;
            case DATABASE:
                return Department.DATABASE_TEAM;
            case INFRASTRUCTURE:
                return Department.INFRASTRUCTURE_TEAM;
            case APPLICATION_SUPPORT:
            case SOFTWARE:
                return Department.APPLICATION_SUPPORT;
            case HARDWARE:
            case OTHER:
            default:
                return Department.IT_SUPPORT;
        }
    }

    public Priority predictPriorityLocal(String description) {
        if (description == null) return Priority.LOW;
        String descLower = description.toLowerCase();
        if (descLower.contains("crash") || descLower.contains("broken") || descLower.contains("fire") || descLower.contains("down") || descLower.contains("cannot work") || descLower.contains("critical")) {
            return Priority.CRITICAL;
        } else if (descLower.contains("vpn") || descLower.contains("database") || descLower.contains("high") || descLower.contains("blocked") || descLower.contains("urgent")) {
            return Priority.HIGH;
        } else if (descLower.contains("warning") || descLower.contains("slow") || descLower.contains("medium")) {
            return Priority.MEDIUM;
        }
        return Priority.LOW;
    }

    private String getLocalEngineerSkill(Category category) {
        switch (category) {
            case NETWORK: return "Network engineering, VPN routing, TCP/IP troubleshooting";
            case SECURITY:
            case ACCESS_MANAGEMENT: return "Access control, identity management, security audit";
            case DATABASE: return "Database administration, SQL query tuning, backup recovery";
            case INFRASTRUCTURE: return "Server maintenance, cloud infrastructure, virtualization";
            case APPLICATION_SUPPORT:
            case SOFTWARE: return "Software debugging, application installation, desktop support";
            case HARDWARE: return "Hardware component testing, peripheral diagnostics";
            case OTHER:
            default: return "General IT support and diagnostic skills";
        }
    }

    private List<String> getLocalResolutionSteps(Category category) {
        List<String> steps = new java.util.ArrayList<>();
        switch (category) {
            case NETWORK:
                steps.add("Verify physical connection of ethernet or check Wi-Fi credentials.");
                steps.add("Disconnect and reconnect to VPN client, check gateway settings.");
                steps.add("Run 'ipconfig /flushdns' in console to flush DNS cache.");
                steps.add("Restart network adapter or contact team lead if gateway is offline.");
                break;
            case ACCESS_MANAGEMENT:
            case SECURITY:
                steps.add("Verify email credentials and spelling (Caps Lock).");
                steps.add("Perform user MFA synchronisation or check authenticator app timer.");
                steps.add("Wait 15 minutes for account lockout cooldown, or execute password reset link.");
                steps.add("Ensure company firewall or proxy is not blocking the connection endpoint.");
                break;
            case DATABASE:
                steps.add("Check if database server instance is running on target port.");
                steps.add("Verify credentials and connection URL string in project properties.");
                steps.add("Ping database host to verify network accessibility.");
                steps.add("Inspect server log files for locking or resource starvation issues.");
                break;
            case INFRASTRUCTURE:
                steps.add("Verify host server power status and cloud VM provisioning status.");
                steps.add("Check server memory and disk usage metrics via SSH terminal.");
                steps.add("Restart target container or VM instance if unpinned.");
                steps.add("Inspect docker-compose or Kubernetes pod lifecycle logs.");
                break;
            case APPLICATION_SUPPORT:
            case SOFTWARE:
                steps.add("Restart the application, ensuring all child processes are terminated.");
                steps.add("Run application as Administrator and verify required file permissions.");
                steps.add("Clear application temporary files or workspace cash folders.");
                steps.add("Reinstall the application client or check for system updates.");
                break;
            case HARDWARE:
                steps.add("Check power cabling, connection ports, and power status.");
                steps.add("Disconnect device, wait 10 seconds, then reconnect to reload drivers.");
                steps.add("Test peripheral component on a different workspace node.");
                steps.add("Open Device Manager to see if device driver shows warning icons.");
                break;
            case OTHER:
            default:
                steps.add("Inspect the local application log or OS system logs for details.");
                steps.add("Perform workstation reboot to clean transient software conflicts.");
                steps.add("Gather screenshot and error codes for further engineering review.");
                break;
        }
        return steps;
    }
}
