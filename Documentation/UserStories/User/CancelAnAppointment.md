# Cancel an appointment

As a registered User, I want to cancel an appointment I can no longer attend
So that the slot is freed for other customers.

An appointment cancelled in time prevents staff and cars from being held for nothing. It also lets the dealership measure how many appointments are cancelled and why.

## Acceptance criteria

* The system asks for confirmation before cancelling and, optionally, the reason.
* The system changes the appointment status to “Cancelled” and releases the slot.
* The system does not show the cancel option for appointments already attended or completed.
* The system notifies the assigned Employee of the cancellation.
* The system logs: date (local time), ClientId, appointmentId and reason.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] The continuous integration server reports no errors.
* [ ] At least one automated test has been created for this feature and it passes.
* [ ] The continuous integration server reports no errors.

## Dificulty of implementacion 2/5