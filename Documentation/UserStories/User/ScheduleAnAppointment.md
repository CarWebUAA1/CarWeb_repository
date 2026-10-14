#  Schedule an appointment

As a registered User, I want to book a date and time to visit the dealership So that someone is ready to attend me when I arrive.

Appointments let the dealership organize its staff and prepare cars in advance. An appointment can be to see a car, take a test drive, start a purchase, or bring the customer's own car for a sale evaluation.

## Acceptance criteria

* The system requires the User to be logged in before scheduling.
* The system shows only available time slots, from the next day up to 30 days ahead.
* The system must validate that the selected date and time are still free when confirming.
* The system does not allow a User to have two appointments at the same time.
* The system saves the appointment with status “Pending”, linked to the ClientId and the selected car.
* The system keeps the data entered if the slot is taken and asks the User to choose another one.
* The system sends a confirmation of the request to the User's email.
* The system logs: date (local time), ClientId, appointmentId and action.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] The continuous integration server reports no errors.
* [ ] The user has scheduled appointment with an employee successfully
* [ ] The database updates employee availability and schedule status instantly 
* [ ] The system enforces scheduling rules (block double booking and invalid times)

## Dificulty of implementacion 4/5