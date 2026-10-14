#  Register an account

As a User (new customer), I want to create an account with my name, phone, email and password So that the dealership can identify me in my appointments and operations Without an account, the dealership cannot link an appointment or a transaction to a real person or contact them later. 

Registration is the entry point to every customer feature except browsing the catalog.

## Acceptance criteria

* The system must validate that all mandatory fields are filled in and that the email has a valid format.
* The system must validate that the phone number contains only digits (10 digits).
* The system must require a password of at least 8 characters, with at least one letter and one number.
* The system does not allow an email that is already registered and offers to log in instead.
* The system stores the password hashed, never in plain text.
* The system assigns a unique ClientId and starts the session when registration finishes.
* The system keeps the data already entered when there is a validation error.
* The system logs: date (local time), ClientId and registration result.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] The continuous integration server reports no errors.

## Dificulty of implementacion 2/5