package dev.divyansh.sprintforge.auth;

import dev.divyansh.sprintforge.common.ApiExceptionHandler.TooManyRequestsException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptLimiter {
    private static final int MAX_FAILURES = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final ConcurrentMap<String, AttemptWindow> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptLimiter(Clock clock) {
        this.clock = clock;
    }

    public void checkAndRecordAttempt(String email) {
        Instant now = clock.instant();
        AtomicBoolean blocked = new AtomicBoolean();
        attempts.compute(email, (key, window) -> {
            if (window == null || !now.isBefore(window.startedAt().plus(WINDOW))) {
                return new AttemptWindow(now, 1);
            }
            if (window.failures() >= MAX_FAILURES) {
                blocked.set(true);
                return window;
            }
            return new AttemptWindow(window.startedAt(), window.failures() + 1);
        });
        if (blocked.get()) {
            throw new TooManyRequestsException(
                    "Too many failed login attempts; try again in 15 minutes");
        }
    }

    public void reset(String email) {
        attempts.remove(email);
    }

    private record AttemptWindow(Instant startedAt, int failures) {}
}
