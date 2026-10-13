# Verify the documents required for each transaction

As an employee, I wish to verify the documentation required for each transaction to ensure compliance with the dealership's security and legal policies.
This prevents fraud and ensures regulatory compliance.

## Acceptance criteria

* The system must allow users to view the documents required for each type of transaction.
* The employee must be able to log received documents and verify their status.
* The system must allow the status of each document to be marked as pending, received, validated, or rejected.
* The system must prevent a transaction from being marked as complete if mandatory documents are missing or if any document has not been validated.
* The system must identify the transaction, the client, and the employee responsible for the verification.
* The system must notify the employee when documentation is incomplete.


## Definition of done

* [ ] Se ha implementado el registro y la validación de documentos.
* [ ] Se han definido los documentos obligatorios para cada tipo de transacción.
* [ ] Se ha probado el bloqueo de transacciones con documentación incompleta.
* [ ] Se han probado los permisos de acceso a la documentación.
* [ ] Se ha verificado el registro de auditoría de las validaciones.