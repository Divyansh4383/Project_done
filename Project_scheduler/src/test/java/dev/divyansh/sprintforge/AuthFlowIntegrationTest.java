package dev.divyansh.sprintforge;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import dev.divyansh.sprintforge.user.User;
import dev.divyansh.sprintforge.user.UserRepository;
import java.util.UUID;

@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowIntegrationTest {
    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository users;

    @Test
    void registersAndReturnsJwt() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"alex@example.org","password":"StrongPass123!","displayName":"Alex Morgan"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("alex@example.org"));
    }

    @Test
    void rejectsInvalidRegistration() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"bad","password":"short","displayName":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").exists());
    }

    @Test
    void returnsCurrentUserProfileForAuthenticatedRequest() throws Exception {
        String registration = register("current-user@example.org", "Current User");
        String token = JsonPath.read(registration, "$.token");
        String userId = JsonPath.read(registration, "$.user.id");

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId))
                .andExpect(jsonPath("$.email").value("current-user@example.org"))
                .andExpect(jsonPath("$.displayName").value("Current User"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void returnsSpecificErrorForInvalidRefreshToken() throws Exception {
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"invalid-refresh-token"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(
                        "Refresh token is invalid or expired"));
    }

    @Test
    void limitsRepeatedFailedLoginsPerEmail() throws Exception {
        for (int attempt = 0; attempt < 5; attempt++) {
            mvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email":"locked-user@example.org","password":"wrong"}
                                    """))
                    .andExpect(status().isUnauthorized());
        }

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"locked-user@example.org","password":"wrong"}
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value(
                        "Too many failed login attempts; try again in 15 minutes"));
    }

    @Test
    void enforcesAdminRoleForRoleChanges() throws Exception {
        String adminRegistration = register("admin-test@example.org", "Admin Test");
        String memberRegistration = register("member-test@example.org", "Member Test");
        UUID adminId = UUID.fromString(JsonPath.read(adminRegistration, "$.user.id"));
        String memberId = JsonPath.read(memberRegistration, "$.user.id");
        String memberToken = JsonPath.read(memberRegistration, "$.token");

        User admin = users.findById(adminId).orElseThrow();
        admin.setRole(User.Role.ADMIN);
        users.save(admin);

        String login = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin-test@example.org","password":"StrongPass123!"}
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String adminToken = JsonPath.read(login, "$.token");

        mvc.perform(patch("/api/v1/admin/users/{userId}/role", memberId)
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"MANAGER\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(patch("/api/v1/admin/users/{userId}/role", memberId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"MANAGER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MANAGER"));
    }

    private String register(String email, String displayName) throws Exception {
        return mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"StrongPass123!","displayName":"%s"}
                                """.formatted(email, displayName)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }
}
