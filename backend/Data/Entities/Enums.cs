namespace Ride.Api.Data.Entities;

public enum BodyStyle
{
    Hatchback,
    Suv,
    Sedan,
    SportCoupe,
    Coupe,
    Crossover,
    Wagon,
    Van,
    Pickup
}

public enum FuelType
{
    Gasoline,
    Diesel,
    Hybrid,
    Electric
}

public enum Transmission
{
    Automatic,
    Manual
}

public enum ListingStatus
{
    Active,
    Inactive,
    Deleted,
    Sold
}

public enum OwnerProfileType
{
    Rent,
    Buy
}

public enum ReservationStatus
{
    Pending,
    Confirmed,
    Cancelled,
    Completed,
    InProgress
}
