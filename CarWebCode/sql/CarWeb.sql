CREATE DATABASE IF NOT EXISTS CarWeb;

USE CarWeb;

CREATE TABLE IF NOT EXISTS Employee (
    EmployeeId INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(150) NOT NULL,
    Password VARCHAR(150) NOT NULL,
    LastActivity INT NOT NULL DEFAULT 0,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS Clients(
    ClientId INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150),
    phone INT,
    Email VARCHAR(150) NOT NULL,
    Password VARCHAR(150) NOT NULL,
    LastActivity INT NOT NULL DEFAULT 0,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS Manager (
    ManagerId INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(150) NOT NULL,
    PasswordHash VARCHAR(150) NOT NULL,
    LastActivity INT NOT NULL DEFAULT 0,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS Cars (
    CarId INT AUTO_INCREMENT PRIMARY KEY,
    VIN VARCHAR(50) NOT NULL,
    Plates VARCHAR(20),
    Brand VARCHAR(100) NOT NULL,
    Model VARCHAR(100) NOT NULL,
    YearOfCar VARCHAR(4) NOT NULL,
    VersionOfCar VARCHAR(100),
    Series VARCHAR(100),
    Mileage INT NOT NULL,
    FuelType VARCHAR(50),
    Transmission VARCHAR(50),
    Color VARCHAR(50) NOT NULL,
    StatusOfCar VARCHAR(50) NOT NULL,
    TireCondition VARCHAR(255) NOT NULL DEFAULT 'Good',
    PurchasePrice DECIMAL(12,2) NOT NULL,
    BasePrice DECIMAL(12,2),
    TestDriveAuthorized BOOLEAN NOT NULL DEFAULT TRUE,
    SalePrice DECIMAL(12,2) NOT NULL,
    InventoryStatus BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS CarPhotos (
    PhotoId INT AUTO_INCREMENT PRIMARY KEY,
    CarId INT NOT NULL,
    PhotoUrl VARCHAR(500) NOT NULL,
    UploadDate DATETIME,
    IsMainPhoto BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_carphotos_car
        FOREIGN KEY (CarId)
        REFERENCES Cars(CarId)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Trades (
    TradeId INT AUTO_INCREMENT PRIMARY KEY,
    TradeType VARCHAR(100),
    TradeStatus VARCHAR(50) NOT NULL,
    Price DECIMAL(12,2),
    TradeDate DATETIME,
    EstimatedMarketPrice DECIMAL(12,2),
    ListingPrice DECIMAL(12,2),
    LastPriceEdit INT NOT NULL,
    ReservedUntil DATETIME NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    ClientId INT NOT NULL,
    CarId INT NOT NULL,
    ManagerId INT UNSIGNED NOT NULL,
    ContractNumber VARCHAR(50),
    CONSTRAINT fk_trades_client
        FOREIGN KEY (ClientId) REFERENCES Clients(ClientId)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trades_car
        FOREIGN KEY (CarId) REFERENCES Cars(CarId)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Receipt (
    ReceiptNumber     INT AUTO_INCREMENT PRIMARY KEY,
    IssueDate         DATETIME,
    Ammount           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    TradeId           INT UNSIGNED NOT NULL
);

CREATE TABLE IF NOT EXISTS StockMovement (
    MovementId       INT AUTO_INCREMENT PRIMARY KEY,
    MovementType     VARCHAR(100),
    Reason            TEXT,
    MovementDate      INT,
    MovementStatus    VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS Document (
    DocumentId        INT AUTO_INCREMENT PRIMARY KEY,
    DocumentType      VARCHAR(100),
    DocumentStatus    VARCHAR(50) NOT NULL,
    ReceivedDate      INT,
    ContractNumber    VARCHAR(50)
);