package com.albertonietolozano.fresco.controller;

import com.albertonietolozano.fresco.dto.request.ClientRequest;
import com.albertonietolozano.fresco.dto.response.ClientResponse;
import com.albertonietolozano.fresco.model.Client;
import com.albertonietolozano.fresco.repository.ClientRepository;
import com.albertonietolozano.fresco.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientRepository clientRepository;

    public ClientController(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @GetMapping
    public ResponseEntity<List<ClientResponse>> getAll() {
        Long tenantId = TenantContext.getTenantId();
        List<ClientResponse> list = clientRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<ClientResponse> create(@RequestBody ClientRequest request) {
        Long tenantId = TenantContext.getTenantId();
        Client client = Client.builder()
                .tenantId(tenantId)
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .notes(request.notes())
                .preferredEmployeeId(request.preferredEmployeeId())
                .preferredServiceId(request.preferredServiceId())
                .build();
        Client saved = clientRepository.save(client);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientResponse> update(@PathVariable Long id, @RequestBody ClientRequest request) {
        Long tenantId = TenantContext.getTenantId();
        Client client = clientRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElse(null);
        if (client == null) return ResponseEntity.notFound().build();
        client.setName(request.name());
        client.setEmail(request.email());
        client.setPhone(request.phone());
        client.setNotes(request.notes());
        client.setPreferredEmployeeId(request.preferredEmployeeId());
        client.setPreferredServiceId(request.preferredServiceId());
        return ResponseEntity.ok(toResponse(clientRepository.save(client)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long tenantId = TenantContext.getTenantId();
        Client client = clientRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElse(null);
        if (client == null) return ResponseEntity.notFound().build();
        clientRepository.delete(client);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<ClientResponse> search(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        Long tenantId = TenantContext.getTenantId();
        if (email != null && !email.isBlank()) {
            return clientRepository.findByTenantIdAndEmail(tenantId, email)
                    .map(this::toResponse).map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        if (phone != null && !phone.isBlank()) {
            return clientRepository.findByTenantIdAndPhone(tenantId, phone)
                    .map(this::toResponse).map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.badRequest().build();
    }

    private ClientResponse toResponse(Client c) {
        return new ClientResponse(c.getId(), c.getTenantId(), c.getName(), c.getEmail(),
                c.getPhone(), c.getNotes(), c.getPreferredEmployeeId(), c.getPreferredServiceId());
    }
}
