#  Log in

As a registered User I want to log in with my email and password So that I can use the features that require an account Scheduling appointments.

buying or selling cars and buying spare parts all require an identified customer. Logging in also protects the account against unauthorized access.

## Acceptance criteria

* The system shows the menu for the user's role (User, Employee or Manager) after logging in.
* The system shows a generic message (“Invalid email or password”) without revealing which field was wrong.
* The system blocks the account for 15 minutes after 3 consecutive failed attempts.
* The system ends the session after 30 minutes of inactivity.
* The system transmits credentials only over HTTPS.
* The system logs: date (local time), ClientId, IP address and result of each attempt.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] The continuous integration server reports no errors.

## Dificulty of implementacion 3/5