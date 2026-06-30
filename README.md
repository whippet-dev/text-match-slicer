# Text Match Slicer

**Text Match Slicer** is a Power BI custom visual that lets report users filter a text column using one or more words, exact phrases, wildcards and Any/All matching.

It is designed for reports that contain free-text data such as feedback, comments, notes, case descriptions, call logs, survey responses, service requests or operational records.

## Features

* Search a text column using one or more words
* Match **Any** search term or **All** search terms
* Search exact phrases using quotation marks
* Use wildcard searches for starts-with, ends-with and contains matching
* Optional search while typing
* Configurable typing delay for better performance on larger datasets
* Clear search button
* Customisable placeholder text
* Customisable search and clear button text/icons
* Customisable font, colours, sizing, spacing and corner radius
* Keyboard-accessible controls
* Enhanced focus indicators for accessibility
* Modern Power BI format pane support

## Search examples

| Search input | Behaviour |
| --- | --- |
| `apple banana` | Searches for the words `apple` and `banana` |
| `"red apple"` | Searches for the exact phrase `red apple` |
| `apple*` | Finds words starting with `apple`, such as `apple`, `apples`, or `applewood` |
| `*apple` | Finds words ending with `apple`, such as `apple`, `pineapple`, or `crabapple` |
| `*apple*` | Finds text containing `apple`, such as `apple`, `pineapple`, or `application` |

## Search modes

The visual includes two optional search mode buttons:

### Any

Matches rows that contain **at least one** of the search terms.

Example:

```text
apple banana
```

In **Any** mode, this matches rows containing either `apple` or `banana`.

### All

Matches rows that contain **every** search term.

Example:

```text
apple banana
```

In **All** mode, this only matches rows containing both `apple` and `banana`.

## Exact phrase search

Use quotation marks to search for an exact phrase.

Example:

```text
"red apple"
```

This matches rows containing the phrase `red apple` in that order.

## Wildcard search

Wildcards can be used at the beginning or end of a search term.

| Pattern | Example | Behaviour |
| --- | --- | --- |
| `word*` | `apple*` | Finds words starting with `apple` |
| `*word` | `*apple` | Finds words ending with `apple` |
| `*word*` | `*apple*` | Finds text containing `apple` anywhere |

## Pasting multiple values

You can paste multiple words or IDs separated by spaces or new lines.

Example:

```text
apple
banana
grape
```

In **Any** mode, this matches rows containing `apple`, `banana`, or `grape`.

For multi-word phrases, use quotation marks:

```text
"red apple"
"green banana"
```

## Format pane options

The visual includes format pane settings for:

### Style

* Font family
* Font size
* Search box and button height
* Corner radius
* Button gap
* Enhanced focus indicators

### Colours

* Search box background
* Search box border
* Placeholder colour
* Search button background
* Search button text
* Clear button background
* Clear button text
* Mode button background
* Mode button text
* Selected mode background
* Selected mode text

### Behaviour

* Placeholder text
* Show or hide Any/All buttons
* Default to All mode
* Icon-only or text button display
* Search icon/text
* Clear icon/text
* Search while typing
* Typing delay in milliseconds

## Accessibility

The visual supports keyboard interaction for the search box and buttons.

Users should be able to:

* Tab to the visual
* Type into the search box
* Press Enter to apply a search when search while typing is off
* Use the clear button with the keyboard
* Change Any/All mode using the keyboard
* Tab out of the visual
* See visible focus indicators when enhanced focus is enabled

## Privacy and security

Text Match Slicer runs inside Power BI as a custom visual.

The visual does not intentionally:

* send report data to external services
* make external network requests
* collect telemetry
* use cookies
* use browser local storage
* require special Power BI visual privileges

Search terms are used only to evaluate the text values supplied to the visual by Power BI and to apply a Power BI filter back to the report.

As with any Power BI report, report authors should only bind fields that are appropriate for their intended audience.

## Performance notes

For larger datasets, complex searches may take slightly longer, especially when using:

* Search while typing
* All mode
* Multiple terms
* Quoted phrases
* Contains wildcard searches such as `*apple*`

For slower reports or larger text columns, consider turning **Search while typing** off or increasing the **Typing delay ms** setting.

## Known limitations

* The visual searches the text values supplied to it by Power BI. Very large or high-cardinality text columns may be subject to Power BI data reduction limits.
* Very broad searches can create large filter selections and may be slower on large datasets.
* Symbol-only searches are not currently supported. For example, searching for `£` alone may not return matches.
* Searching for values such as `£25.50` may still match because the numeric part is searchable.
* Pasted comma-separated lists may not behave the same as pasted line-separated lists.
* Multi-word pasted values should be wrapped in quotation marks if they need to be treated as exact phrases.
* Very large datasets may require **Search while typing** to be turned off for the smoothest experience.

## Recommended use cases

This visual is useful for:

* Free-text feedback
* Customer comments
* Survey responses
* Case notes
* Complaint descriptions
* Call logs
* Operational notes
* Incident descriptions
* Service request summaries
* Any report where users need to search text rather than select from a fixed category list

## Development status

Text Match Slicer is currently at initial release stage.

Current focus areas:

* Core search behaviour
* Accessibility
* Format pane customisation
* Power BI slicer/filter interaction
* Performance on larger datasets

Potential future enhancements:

* Symbol-aware searching
* Dedicated paste-list mode
* Result count display
* Search term highlighting
* More advanced matching options
* Improved handling of comma-separated values

## Version

Initial development version: `1.0.0`

## Publisher

Text Match Slicer is published by Whippet Dev.

Contact: whippet.dev@gmail.com

## Support

For support, issues, or feature requests, raise an issue in the project repository:

https://github.com/whippet-dev/text-match-slicer/issues

You can also contact the publisher at:

whippet.dev@gmail.com
