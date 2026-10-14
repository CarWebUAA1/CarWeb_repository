#  Modify an appointment

As a registered User, I want to change the date or time of my appointment
So that I can still attend if my plans change

If customers cannot change their appointment, they will most likely just not show up. Allowing changes reduces no-shows and frees slots for other customers.

## Acceptance criteria

* The system allows modifying only appointments with status “Pending” or “Confirmed”.
* The system does not allow changes less than 2 hours before the appointment and asks the User to call the dealership.
* The system must validate that the new time slot is available.
* The system releases the previous slot and sets the appointment back to “Pending”.
* The system notifies the assigned Employee of the change.
* The system keeps the original appointment if an error occurs while saving.
* The system logs: date (local time), ClientId, appointmentId, previous and new time slot.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] The continuous integration server reports no errors.

## Dificulty of implementacion 3/5