using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Ride.Api.Utilities;

public static class SlugHelper
{
    private static readonly Regex NonSlugChars = new("[^a-z0-9]+", RegexOptions.Compiled);
    private static readonly Regex MultiDash = new("-{2,}", RegexOptions.Compiled);

    public static string Slugify(string value, int maxLength = 120)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var c in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsLetterOrDigit(c))
            {
                builder.Append(c);
            }
            else
            {
                builder.Append('-');
            }
        }

        var slug = builder.ToString();
        slug = NonSlugChars.Replace(slug, "-");
        slug = MultiDash.Replace(slug, "-").Trim('-');

        if (slug.Length > maxLength)
        {
            slug = slug[..maxLength].Trim('-');
        }

        return slug;
    }
}
