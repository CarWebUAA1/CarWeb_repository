#  Register and update inventory

As a Manager, I want to add, edit, delete and change the status of cars and spare parts, So that the catalog always shows what we really have
The catalog customers see is only as good as the inventory behind it. 

If a sold car still shows as available, the dealership loses credibility and wastes customers' time.

## Acceptance criteria

* The system requires brand, model, year, mileage, purchase price and sale price to register a car.
* The system assigns a unique CarId to each car and a unique PartId to each spare part.
* The system rejects a car whose VIN is already registered.
* The system must validate that prices are greater than zero and that the sale price is not lower than the purchase price without confirmation.
* The system blocks deleting or changing the status of a car with an operation in progress.
* The system shows new cars in the catalog as “Available” within 1 minute.
* The system allows only users with the Manager role to make inventory changes.
* The system logs: date (local time), manager ID, CarId or PartId, action and changed fields.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] All unit tests pass (green).
* [ ] The functional analyst (product owner) has approved the feature.
* [ ] At least one automated test has been created for this feature and it passes.
* [ ] The continuous integration server reports no errors.

## Dificulty of implementacion 2/5