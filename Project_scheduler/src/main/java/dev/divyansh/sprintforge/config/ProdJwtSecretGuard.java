package dev.divyansh.sprintforge.config;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class ProdJwtSecretGuard {
    static final String DEFAULT_SECRET = "change-this-local-development-secret-key-32chars";

    public ProdJwtSecretGuard(
            Environment environment,
            @Value("${app.jwt.secret}") String secret) {
        boolean production = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (production && DEFAULT_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "A non-default app.jwt.secret is required when the prod profile is active");
        }
    }
}
