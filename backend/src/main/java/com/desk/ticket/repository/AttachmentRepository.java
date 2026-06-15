package com.desk.ticket.repository;

import com.desk.ticket.entity.Attachment;
import com.desk.ticket.dto.AttachmentResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    
    @Query("SELECT new com.desk.ticket.dto.AttachmentResponse(a.id, a.ticket.id, a.fileName, a.fileType, a.createdAt) " +
           "FROM Attachment a WHERE a.ticket.id = :ticketId")
    List<AttachmentResponse> findMetadataByTicketId(@Param("ticketId") Long ticketId);

    List<Attachment> findByTicketId(Long ticketId);
}
