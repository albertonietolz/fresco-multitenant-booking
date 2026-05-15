package com.albertonietolozano.fresco.service;

import com.albertonietolozano.fresco.dto.request.CustomFieldRequest;
import com.albertonietolozano.fresco.dto.response.CustomFieldResponse;

import java.util.List;

public interface CustomFieldService {

    CustomFieldResponse createForService(Long serviceId, CustomFieldRequest request);

    List<CustomFieldResponse> getByService(Long serviceId);

    void delete(Long id);
}
