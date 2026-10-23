package dev.divyansh.sprintforge.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationOutboxProcessorTest {
    private static final Instant NOW = Instant.parse("2026-09-18T00:00:00Z");

    @Mock
    NotificationOutboxRepository outbox;

    @Mock
    EmailNotificationSender sender;

    @Test
    void marksSuccessfullyDeliveredEventAsProcessed() {
        NotificationOutbox event = pendingEvent(5);
        when(outbox.lockDue(NOW, 20)).thenReturn(List.of(event));
        NotificationOutboxProcessor processor = processor();

        assertThat(processor.processBatch()).isEqualTo(1);

        verify(sender).send(event);
        assertThat(event.getStatus()).isEqualTo(NotificationOutbox.Status.PROCESSED);
        assertThat(event.getAttempts()).isEqualTo(1);
        assertThat(event.getProcessedAt()).isEqualTo(NOW);
    }

    @Test
    void appliesExponentialBackoffAfterDeliveryFailure() {
        NotificationOutbox event = pendingEvent(5);
        when(outbox.lockDue(NOW, 20)).thenReturn(List.of(event));
        doThrow(new IllegalStateException("SMTP unavailable")).when(sender).send(event);
        NotificationOutboxProcessor processor = processor();

        processor.processBatch();

        assertThat(event.getStatus()).isEqualTo(NotificationOutbox.Status.RETRY);
        assertThat(event.getAttempts()).isEqualTo(1);
        assertThat(event.getNextAttemptAt()).isEqualTo(NOW.plusSeconds(10));
        assertThat(event.getLastError()).isEqualTo("SMTP unavailable");
    }

    @Test
    void deadLettersAnEventAfterItsFinalAttempt() {
        NotificationOutbox event = pendingEvent(1);
        when(outbox.lockDue(NOW, 20)).thenReturn(List.of(event));
        doThrow(new IllegalStateException("Permanent failure")).when(sender).send(event);
        NotificationOutboxProcessor processor = processor();

        processor.processBatch();

        assertThat(event.getStatus()).isEqualTo(NotificationOutbox.Status.DEAD);
        assertThat(event.getAttempts()).isEqualTo(1);
        assertThat(event.getDeadLetteredAt()).isEqualTo(NOW);
    }

    private NotificationOutboxProcessor processor() {
        return new NotificationOutboxProcessor(
                outbox,
                sender,
                Clock.fixed(NOW, ZoneOffset.UTC),
                20,
                Duration.ofSeconds(10),
                Duration.ofMinutes(15));
    }

    private static NotificationOutbox pendingEvent(int maxAttempts) {
        NotificationOutbox event = new NotificationOutbox();
        event.setId(UUID.randomUUID());
        event.setEventType("PROJECT_INVITATION");
        event.setAggregateType("PROJECT");
        event.setAggregateId(UUID.randomUUID());
        event.setIdempotencyKey(UUID.randomUUID().toString());
        event.setRecipient("member@example.org");
        event.setSubject("Invitation");
        event.setBody("You were invited");
        event.setStatus(NotificationOutbox.Status.PENDING);
        event.setAttempts(0);
        event.setMaxAttempts(maxAttempts);
        event.setNextAttemptAt(NOW);
        event.setCreatedAt(NOW);
        return event;
    }
}
