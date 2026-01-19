# Basix 0.9.5

Basix is intended as a starter for the rapid development of a design. Each design element can be added individually to
include only the data required. It is using plain javascript and therefore is not dependent on any plugin.

A demo can be found here: <a href="http://www.andibauer.at/basix/" target="_blank">http://www.andibauer.at/basix/</a>

### TODO

* editor
* carousel
* chat
* color picker
* html tooltips
* timeline
* uploader
* gallery
* simple table
* documentation

### Benefits

* lightweight
* customizable
* no dependencies, completely vanilla javascript (or css only)

## Usage

Take a look at style.scss for a glimpse on a full import. reset, parameters, colors & defaults are mandatory, anything
else can be added as needed.

To use the import functionality of javascript files you need to import your main script as a module. And either build
your own css or inclulde the existing full style.css (or min)

``` html
<link rel="stylesheet" href="css/style.css" type="text/css">
<script src="js/index.js" type="module"></script>
```
# Available Components
## Accordion
## Alert
Alerts can have either the alert-error, alert-warning or alert-success class to change color accordingly 
``` html
<div class="alert alert-error"><strong>Error: </strong> This is an error alert!</div>
```
## Button
Buttons can have either no class (default styling) or the button-error, button-warning, button-success colors
``` html
<button class="button-error">Error</button>
```
## Card
## Colors
## Form
### Checkbox
### Input
### Select
### Switch
### Radio Buttons
## Grid
## Icons
## Modal
## Placeholder
## Progress Bar
## Push Menu
## Scrollbar
## Spinner
## Table
## Tabs
## Toast
## Tooltip
## Typography