using System;
using Microsoft.Extensions.Configuration;

namespace Ride.Api.Utilities;

public static class FeatureFlags
{
    private static readonly IConfigurationRoot Configuration = new ConfigurationBuilder()
        .SetBasePath(AppContext.BaseDirectory)
        .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true, reloadOnChange: false)
        .Build();

    private static bool ReadFlag(string envName, string? configKey, bool fallback)
    {
        var value = Environment.GetEnvironmentVariable(envName);
        if (string.IsNullOrWhiteSpace(value) && !string.IsNullOrWhiteSpace(configKey))
        {
            value = Configuration[configKey];
        }
        if (string.IsNullOrWhiteSpace(value)) return fallback;
        var normalized = value.Trim().ToLowerInvariant();
        return normalized is "1" or "true" or "yes" or "on";
    }

    public static bool TrialEnabled => ReadFlag("FEATURE_TRIAL", "FeatureFlags:TrialEnabled", true);
    public static bool SubscriptionsEnabled => ReadFlag("FEATURE_SUBSCRIPTIONS", "FeatureFlags:SubscriptionsEnabled", true);
}
