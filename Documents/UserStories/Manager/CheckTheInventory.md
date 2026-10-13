#  Check the inventory

As a Manager, I want to see all cars and parts with their status and totals
So that I can decide what to buy and how to price it

The Manager needs a quick overview of the stock to make purchasing and pricing decisions. Totals by status show at a glance how much is available and how much capital is tied up.

## Acceptance criteria

* The system shows each item's ID, brand, model, year, status, inventory status and price.
* The system shows totals of available, reserved, sold and out-of-service items, and the total inventory value.
* The system allows filtering by status, brand, model and type (car or spare part), and updates the totals.
* The system shows an item's complete information and movement history when it is selected.
* The system loads the inventory in less than 5 seconds for up to 1,000 items.
* The system does not modify any data from this screen.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] All unit tests pass (green).
* [ ] The functional analyst (product owner) has approved the feature.
* [ ] At least one automated test has been created for this feature and it passes.
* [ ] The continuous integration server reports no errors.