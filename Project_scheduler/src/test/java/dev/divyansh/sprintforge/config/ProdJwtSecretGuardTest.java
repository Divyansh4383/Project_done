package dev.divyansh.sprintforge.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class ProdJwtSecretGuardTest {
    @Test
    void refusesTheDefaultJwtSecretInProduction() {
        new ApplicationContextRunner()
                .withInitializer(context ->
                        context.getEnvironment().setActiveProfiles("prod"))
                .withUserConfiguration(ProdJwtSecretGuard.class)
                .withPropertyValues("app.jwt.secret=" + ProdJwtSecretGuard.DEFAULT_SECRET)
                .run(context -> assertThat(context.getStartupFailure())
                        .hasRootCauseInstanceOf(IllegalStateException.class)
                        .hasRootCauseMessage(
                                "A non-default app.jwt.secret is required when the prod profile is active"));
    }

    @Test
    void allowsTheDefaultJwtSecretOutsideProduction() {
        new ApplicationContextRunner()
                .withUserConfiguration(ProdJwtSecretGuard.class)
                .withPropertyValues("app.jwt.secret=" + ProdJwtSecretGuard.DEFAULT_SECRET)
                .run(context -> assertThat(context).hasNotFailed());
    }
}
