package com.albertonietolozano.fresco.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendBookingConfirmation(
            String to,
            String customerName,
            String tenantName,
            String serviceName,
            LocalDate date,
            LocalTime startTime
    ) {
        if (fromAddress == null || fromAddress.isBlank()) {
            log.warn("Email no configurado (MAIL_USERNAME vacío). Saltando envío a {}", to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject("Reserva confirmada - " + tenantName);
            message.setText(
                    "Hola " + customerName + ",\n\n" +
                    "Tu reserva ha sido registrada correctamente.\n\n" +
                    "Servicio: " + serviceName + "\n" +
                    "Fecha: " + date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + "\n" +
                    "Hora: " + startTime.format(DateTimeFormatter.ofPattern("HH:mm")) + "\n\n" +
                    "Gracias por confiar en " + tenantName + ".\n"
            );
            mailSender.send(message);
            log.info("Confirmación de reserva enviada a {}", to);
        } catch (Exception e) {
            log.error("Error al enviar email de confirmación a {}: {}", to, e.getMessage());
        }
    }
}
