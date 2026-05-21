package com.albertonietolozano.fresco;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class FrescoApplication {

	public static void main(String[] args) {
		SpringApplication.run(FrescoApplication.class, args);
	}

}
