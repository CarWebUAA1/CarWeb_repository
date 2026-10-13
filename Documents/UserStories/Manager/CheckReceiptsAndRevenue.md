#  Check receipts and revenue

As a Manager, I want to see the receipts and revenue for a chosen period
So that I can track how the dealership is performing Revenue is the main indicator of how the business is doing. Seeing receipts by period helps the Manager spot good and bad months and compare income from sales with money spent on purchases.

## Acceptance criteria

* The system must validate that the start date is not later than the end date.
* The system shows each completed operation's receipt with number, date, customer, type and amount.
* The system shows income from sales, money spent on purchases and net revenue (calculateRevenue).
* The system shows totals of $0 and a message when there are no operations in the period.
* The system allows printing or exporting the report as PDF.
* The system allows only users with the Manager role to view revenue.

## Definition of done

* [ ] The client has reviewed and approved the user story after the understanding stage.
* [ ] The client has seen and accepted the screen mockups.
* [ ] The code has been fully reviewed across successive commits.
* [ ] Static code analysis finds no high or critical severity errors.
* [ ] All unit tests pass (green).
* [ ] The functional analyst (product owner) has approved the feature.
* [ ] At least one automated test has been created for this feature and it passes.
* [ ] The continuous integration server reports no errors.