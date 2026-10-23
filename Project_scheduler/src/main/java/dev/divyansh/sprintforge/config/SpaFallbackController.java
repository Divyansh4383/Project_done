package dev.divyansh.sprintforge.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class SpaFallbackController {
    @GetMapping({
        "/",
        "/{path:[A-Za-z0-9_-]+}",
        "/{first:[A-Za-z0-9_-]+}/{second:[A-Za-z0-9_-]+}",
        "/{first:[A-Za-z0-9_-]+}/{second:[A-Za-z0-9_-]+}/{third:[A-Za-z0-9_-]+}",
        "/{first:[A-Za-z0-9_-]+}/{second:[A-Za-z0-9_-]+}/{third:[A-Za-z0-9_-]+}/{fourth:[A-Za-z0-9_-]+}"
    })
    String forwardToApp(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.equals("/api")
                || path.startsWith("/api/")
                || path.equals("/actuator")
                || path.startsWith("/actuator/")
                || path.startsWith("/assets/")
                || path.equals("/docs")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return "forward:/index.html";
    }
}
