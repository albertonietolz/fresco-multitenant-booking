package com.albertonietolozano.fresco.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
            LocalTime startTime,
            String referenceCode,
            String cancelToken,
            String slug,
            String cancellationPolicy
    ) {
        if (fromAddress == null || fromAddress.isBlank()) {
            log.warn("Email no configurado (MAIL_USERNAME vacío). Saltando envío a {}", to);
            return;
        }
        try {
            String dateStr  = date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            String timeStr  = startTime.format(DateTimeFormatter.ofPattern("HH:mm"));

            String appBase  = "http://localhost:5173";
            String cancelUrl = appBase + "/booking/" + slug + "?cancel=" + cancelToken;

            String policyBlock = (cancellationPolicy != null && !cancellationPolicy.isBlank())
                    ? """
                      <tr>
                        <td style="padding:20px 24px 0;">
                          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6a5f52;text-transform:uppercase;letter-spacing:0.06em;">Política de cancelación</p>
                          <p style="margin:0;font-size:13px;color:#6a5f52;line-height:1.6;">%s</p>
                        </td>
                      </tr>
                      """.formatted(cancellationPolicy)
                    : "";

            String html = """
                    <!DOCTYPE html>
                    <html lang="es">
                    <head><meta charset="UTF-8"></head>
                    <body style="margin:0;padding:0;background:#f4f0e6;font-family:'Helvetica Neue',Arial,sans-serif;">
                      <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f0e6;padding:40px 0;">
                        <tr><td align="center">
                          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

                            <!-- Cabecera -->
                            <tr>
                              <td style="background:#1a3070;padding:32px 40px;text-align:center;">
                                <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.04em;">%s</p>
                                <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.65);letter-spacing:0.06em;text-transform:uppercase;">Confirmación de reserva</p>
                              </td>
                            </tr>

                            <!-- Cuerpo -->
                            <tr>
                              <td style="padding:36px 40px 28px;">
                                <p style="margin:0 0 6px;font-size:17px;color:#110e0a;">Hola, <strong>%s</strong></p>
                                <p style="margin:0 0 28px;font-size:14px;color:#6a5f52;line-height:1.6;">Tu reserva ha sido registrada correctamente. Aquí tienes el resumen:</p>

                                <!-- Tarjeta de detalle -->
                                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f0e6;border-radius:8px;overflow:hidden;margin-bottom:20px;">
                                  <tr>
                                    <td style="padding:20px 24px;">
                                      <table width="100%%" cellpadding="0" cellspacing="0">
                                        <tr>
                                          <td style="padding:7px 0;border-bottom:1px solid #d8cfc0;">
                                            <span style="font-size:12px;color:#6a5f52;text-transform:uppercase;letter-spacing:0.06em;">Referencia</span>
                                          </td>
                                          <td align="right" style="padding:7px 0;border-bottom:1px solid #d8cfc0;">
                                            <strong style="font-size:14px;color:#1a3070;font-family:monospace;letter-spacing:0.12em;">%s</strong>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td style="padding:7px 0;border-bottom:1px solid #d8cfc0;">
                                            <span style="font-size:12px;color:#6a5f52;text-transform:uppercase;letter-spacing:0.06em;">Servicio</span>
                                          </td>
                                          <td align="right" style="padding:7px 0;border-bottom:1px solid #d8cfc0;">
                                            <strong style="font-size:14px;color:#110e0a;">%s</strong>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td style="padding:7px 0;border-bottom:1px solid #d8cfc0;">
                                            <span style="font-size:12px;color:#6a5f52;text-transform:uppercase;letter-spacing:0.06em;">Fecha</span>
                                          </td>
                                          <td align="right" style="padding:7px 0;border-bottom:1px solid #d8cfc0;">
                                            <strong style="font-size:14px;color:#110e0a;">%s</strong>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td style="padding:7px 0;">
                                            <span style="font-size:12px;color:#6a5f52;text-transform:uppercase;letter-spacing:0.06em;">Hora</span>
                                          </td>
                                          <td align="right" style="padding:7px 0;">
                                            <strong style="font-size:14px;color:#1a3070;">%s h</strong>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  %s
                                </table>

                                <!-- Botón cancelar -->
                                <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                  <tr>
                                    <td align="center">
                                      <a href="%s" style="display:inline-block;padding:10px 24px;background:#f4f0e6;color:#6a5f52;border:1px solid #d8cfc0;border-radius:6px;font-size:13px;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;">Cancelar mi cita</a>
                                    </td>
                                  </tr>
                                </table>

                                <p style="margin:0;font-size:13px;color:#6a5f52;line-height:1.7;">
                                  ¿Prefieres llamar? Contacta directamente con <strong style="color:#110e0a;">%s</strong>.
                                </p>
                              </td>
                            </tr>

                            <!-- Pie -->
                            <tr>
                              <td style="background:#f4f0e6;padding:18px 40px;text-align:center;border-top:1px solid #d8cfc0;">
                                <p style="margin:0;font-size:12px;color:#6a5f52;">Este correo ha sido generado automáticamente por <strong>%s</strong>.</p>
                              </td>
                            </tr>

                          </table>
                        </td></tr>
                      </table>
                    </body>
                    </html>
                    """.formatted(tenantName, customerName, referenceCode, serviceName, dateStr, timeStr,
                            policyBlock, cancelUrl, tenantName, tenantName);

            var message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Reserva confirmada · " + tenantName);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Confirmación de reserva enviada a {}", to);
        } catch (Exception e) {
            log.error("Error al enviar email de confirmación a {}: {}", to, e.getMessage());
        }
    }
}
