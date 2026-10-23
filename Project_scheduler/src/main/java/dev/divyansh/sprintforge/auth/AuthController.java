package dev.divyansh.sprintforge.auth;

import dev.divyansh.sprintforge.common.ApiExceptionHandler.ConflictException;
import dev.divyansh.sprintforge.common.ApiExceptionHandler.NotFoundException;
import dev.divyansh.sprintforge.user.User;
import dev.divyansh.sprintforge.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final TokenService tokens;
    private final LoginAttemptLimiter loginAttempts;

    public AuthController(
            UserRepository users,
            PasswordEncoder passwords,
            TokenService tokens,
            LoginAttemptLimiter loginAttempts) {
        this.users = users;
        this.passwords = passwords;
        this.tokens = tokens;
        this.loginAttempts = loginAttempts;
    }

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 120) String displayName) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {}

    public record AuthResponse(
            String token,
            String refreshToken,
            String tokenType,
            long expiresIn,
            UserView user) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record UserView(
            UUID id,
            String email,
            String displayName,
            String role) {}

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email is already registered");
        }

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setPasswordHash(passwords.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        user.setRole(User.Role.USER);
        user.setCreatedAt(Instant.now());
        users.save(user);
        log.info("User registered: userId={}", user.getId());
        return issueToken(user);
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String email = normalizeEmail(request.email());
        loginAttempts.checkAndRecordAttempt(email);
        User user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> failedLogin(email));
        if (!passwords.matches(request.password(), user.getPasswordHash())) {
            throw failedLogin(email);
        }
        loginAttempts.reset(email);
        return issueToken(user);
    }

    @GetMapping("/me")
    UserView me(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        User user = users.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return userView(user);
    }

    @PostMapping("/refresh")
    AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        TokenService.RotatedToken rotated = tokens.rotate(request.refreshToken());
        return response(
                rotated.user(),
                rotated.accessToken(),
                rotated.refreshToken(),
                rotated.expiresIn());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(@Valid @RequestBody RefreshRequest request) {
        tokens.revoke(request.refreshToken());
    }

    private AuthResponse issueToken(User user) {
        TokenService.TokenPair pair = tokens.issue(user);
        return response(user, pair.accessToken(), pair.refreshToken(), pair.expiresIn());
    }

    private AuthResponse response(
            User user, String accessToken, String refreshToken, long expiresIn) {
        return new AuthResponse(
                accessToken, refreshToken, "Bearer", expiresIn, userView(user));
    }

    private UserView userView(User user) {
        return new UserView(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name());
    }

    private BadCredentialsException failedLogin(String email) {
        return new BadCredentialsException("Invalid credentials");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
