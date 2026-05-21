package com.albertonietolozano.fresco.repository;

import com.albertonietolozano.fresco.model.CustomFieldOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CustomFieldOptionRepository extends JpaRepository<CustomFieldOption, Long> {

    List<CustomFieldOption> findAllByCustomFieldIdOrderBySortOrderAsc(Long customFieldId);

    @Transactional
    void deleteAllByCustomFieldId(Long customFieldId);
}
