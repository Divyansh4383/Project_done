package dev.divyansh.sprintforge.user;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.bootstrap-admin.enabled", havingValue = "true")
public class AdminBootstrap implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final String email;
    private final String password;
    private final String displayName;

    public AdminBootstrap(
            UserRepository users,
            PasswordEncoder passwords,
            @Value("${app.bootstrap-admin.email}") String email,
            @Value("${app.bootstrap-admin.password}") String password,
            @Value("${app.bootstrap-admin.name:SprintForge Administrator}") String displayName) {
        this.users = users;
        this.passwords = passwords;
        this.email = email;
        this.password = password;
        this.displayName = displayName;
    }

    @Override
    public void run(ApplicationArguments args) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(normalizedEmail)) {
            return;
        }
        User admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setEmail(normalizedEmail);
        admin.setPasswordHash(passwords.encode(password));
        admin.setDisplayName(displayName);
        admin.setRole(User.Role.ADMIN);
        admin.setCreatedAt(Instant.now());
        users.save(admin);
    }
}
