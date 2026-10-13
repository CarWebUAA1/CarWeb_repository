#  Record stock in and stock out

As a Manager, I want to record every car or part that enters or leaves the dealership So that I can trace where each item is Knowing what is physically in the lot prevents losses and mistakes, such as selling a car that has already left. Each movement leaves a trace of who moved what, when and why.

## Acceptance criteria

* The system requires the type (in or out) and the reason (purchase, sale, transfer, return, spare parts) for each movement.
* The system rejects a stock out for an item that is not in stock, and a stock in for an item that already is.
* The system updates the item's inventory status (InventoryStatus) with each movement.
* The system records the movement automatically when an operation is approved.
* The system never allows deleting a movement; corrections are made with a new opposite movement.
* The system logs: date (local time), manager ID, item ID, type and reason.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] All unit tests pass (green).
* [ ] The functional analyst (product owner) has approved the feature.
* [ ] At least one automated test has been created for this feature and it passes.
* [ ] The continuous integration server reports no errors.