package dev.divyansh.sprintforge.auth;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import dev.divyansh.sprintforge.common.ApiExceptionHandler.TooManyRequestsException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class LoginAttemptLimiterTest {
    private final LoginAttemptLimiter limiter = new LoginAttemptLimiter(
            Clock.fixed(Instant.parse("2026-10-23T00:00:00Z"), ZoneOffset.UTC));

    @Test
    void blocksAfterFiveFailedAttemptsAndResetsAfterSuccessfulLogin() {
        for (int i = 0; i < 5; i++) {
            limiter.checkAndRecordAttempt("user@example.org");
        }

        assertThrows(
                TooManyRequestsException.class,
                () -> limiter.checkAndRecordAttempt("user@example.org"));

        limiter.reset("user@example.org");

        assertDoesNotThrow(() -> limiter.checkAndRecordAttempt("user@example.org"));
    }

    @Test
    void tracksAttemptsIndependentlyByEmail() {
        for (int i = 0; i < 5; i++) {
            limiter.checkAndRecordAttempt("blocked@example.org");
        }

        assertDoesNotThrow(() -> limiter.checkAndRecordAttempt("other@example.org"));
    }
}
