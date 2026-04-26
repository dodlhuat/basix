# Basix 1.2.6

Basix is intended as a starter for the rapid development of a design. Each design element can be added individually to
include only the data required. It is using plain javascript / typescript and therefore is not dependent on any plugin.

A demo can be found here: <a href="http://www.andibauer.at/basix/" target="_blank">http://www.andibauer.at/basix/</a>

### Benefits

* lightweight
* customizable
* no dependencies, completely vanilla javascript (or css only)

## Usage

Take a look at style.scss for a glimpse on a full import. reset, parameters, colors & defaults are mandatory, anything
else can be added as needed.

Include the stylesheet and import individual components as ES modules. There is no bundled entry point — only the components you use are loaded.

``` html
<link rel="stylesheet" href="css/style.css" type="text/css">
<script type="module">
    import { Chart }   from './js/chart.js';
    import { Modal }   from './js/modal.js';
    import { Stepper } from './js/stepper.js';
    // … add only what you need
</script>
```

When installed via npm, import from the package:

``` js
import { Chart }   from '@dodlhuat/basix/js/chart.js';
import { Modal }   from '@dodlhuat/basix/js/modal.js';
```

---

# Available Components

## Layout

### Grid System

The Grid component provides a flexbox-based layout system. Use `.row` with `.column` children. Columns can use `.grow-2` through `.grow-6` for proportional sizing. Responsive — stacks on mobile.

``` html
<div class="row">
    <div class="column">Column 1</div>
    <div class="column grow-2">Column 2 (2x)</div>
    <div class="column">Column 3</div>
</div>
```

### Typography

The typography system is built around the Outfit variable font, providing a modern, readable base for all text. Headings follow a clear scale with bold weight and tighter line spacing for strong visual hierarchy. Utility classes enable simple text alignment. Monospace fonts are reserved for code.

### Cards

The Card component is a CSS-only component that creates visually contained content sections with optional header and footer. Use `.card` on rows or columns to wrap them into a card.

``` html
<div class="row card">
    <div class="column">Card content</div>
</div>
```

### Icons

Basix ships icons in two formats:

**Font icons** — a reduced Google Material Icon font (~5.5 KB vs the full 242.5 KB). Use the `.icon` class with a modifier.

``` html
<span class="icon icon-home"></span>
```

**SVG sprite** — a single `svg-icons/icons.svg` sprite file. Preferred when you need consistent sizing, color inheritance via `currentColor`, or icons inside JS-generated markup.

``` html
<svg class="icon-svg"><use href="svg-icons/icons.svg#home"/></svg>
```

---

## Forms

The Form styles provide consistent styling for inputs, textareas, and native elements.

### Text Input

``` html
<label for="my-input">Text Input</label>
<input type="text" id="my-input" />
```

### Textarea

``` html
<label for="my-textarea">Text Area</label>
<textarea id="my-textarea"></textarea>
```

### Checkbox

The Checkbox component provides custom-styled checkboxes.

``` html
<input class="styled-checkbox" id="checkbox-1" type="checkbox" value="1" />
<label for="checkbox-1">Checkbox</label>
```

### Radio Buttons

The Radio Button component provides custom-styled radio inputs.

``` html
<label class="radio-button-container">One
    <input type="radio" checked="checked" name="radio" />
    <span class="checkmark"></span>
</label>
```

### Switch

The Switch component creates styled toggle switches based on checkboxes.

``` html
<div class="switch">
    <input type="checkbox" id="switch" />
    <label for="switch">Toggle</label>
</div>
```

### Range Slider

The Range Slider component creates a styled slider with a CSS custom property `--range-fill` that tracks the current value for fill styling. Use the JS class to initialise fill tracking automatically.

``` html
<div class="range-slider">
    <input type="range" min="1" max="100" value="50" />
</div>
```

``` js
// Initialise a single slider
new RangeSlider(document.querySelector('.range-slider input'));

// Or initialise all sliders on the page at once
RangeSlider.initAll();
```

---

## Navigation

### Push Menu

The PushMenu component creates a sidebar navigation that "pushes" the main content when opened. Uses a checkbox-based toggle mechanism.

### Flyout Menu

The Flyout Menu component creates slide-in navigation menus with nested submenus. Supports left/right direction, header/footer and keyboard navigation (Escape to close).

| Option | Type | Default | Description |
|---|---|---|---|
| `triggerSelector` | string | `'.menu-trigger'` | CSS selector for the element(s) that open the menu |
| `menuSelector` | string | `'#flyoutMenu'` | CSS selector for the flyout menu element |
| `overlaySelector` | string | `'#flyoutOverlay'` | CSS selector for the backdrop overlay |
| `closeSelector` | string | `'.close-menu'` | CSS selector for close button(s) inside the menu |
| `direction` | string | `'right'` | Slide-in direction, either `'right'` or `'left'` |
| `title` | string | `'Menu'` | Shown in the header if enabled |
| `enableHeader` | boolean | `true` | Shows the menu header |
| `footerText` | string | `'© 2025 Brand Inc.'` | Shown in the footer if enabled |
| `enableFooter` | boolean | `true` | Shows the menu footer |

### Popover

The Popover component attaches a floating content panel to any trigger element. Supports click and hover trigger modes, four placement directions, optional arrow, and stacks correctly when multiple popovers exist.

| Option | Type | Default | Description |
|---|---|---|---|
| `content` | string | — | HTML content rendered inside the popover |
| `placement` | string | `'top'` | Preferred placement: `'top'`, `'bottom'`, `'left'`, `'right'`, or `'auto'` |
| `align` | string | `'center'` | Alignment along the axis: `'start'`, `'center'`, `'end'` |
| `offset` | number | `8` | Distance in px between the trigger and the popover |
| `arrow` | boolean | `true` | Shows a directional arrow |
| `triggerMode` | string | `'click'` | `'click'` or `'hover'` |
| `closeOnOutsideClick` | boolean | `true` | Closes when clicking outside |
| `closeOnEscape` | boolean | `true` | Closes on Escape key |
| `className` | string | — | Extra CSS class on the popover element |
| `onOpen` | function | — | Callback fired when the popover opens |
| `onClose` | function | — | Callback fired when the popover closes |

``` js
const pop = new Popover('#my-trigger', {
    content: '<p>Popover content</p>',
    placement: 'bottom',
    triggerMode: 'click',
});

pop.open();
pop.close();
pop.toggle();
pop.destroy();
```

### Dropdown Menu

The Dropdown Menu allows to create multi-level dropdown menus with nested submenus. The menu fires custom events `CustomEvent<DropdownSelectDetail>` that can be listened to in order to react to user selections.

``` html
<div class="dropdown-container" id="myDropdown">
    <button class="dropdown-trigger">Select Option</button>
    <ul class="dropdown-menu">
        <li><div class="dropdown-item">Profile</div></li>
        <li>
            <div class="dropdown-item">Settings</div>
            <ul>
                <li><div class="dropdown-item">Account</div></li>
            </ul>
        </li>
    </ul>
</div>
```

---

## Feedback

### Modal

The Modal component creates dialog overlays with header, content, and footer sections. Supports types (success, error, warning, info) and close on Escape key.

| Parameter | Type | Description |
|---|---|---|
| `content` | string | Content of the modal. Can be HTML or a simple string |
| `header` | string | Header of the modal. Can be HTML or a simple string |
| `footer` | string | Footer of the modal. Can be HTML or a simple string |
| `closeable` | boolean | Shows a close button |
| `type` | ModalType | The type of the modal (success, error, warning, info, default) |

### Toast

The Toast component shows brief notification messages.

| Parameter | Type | Description |
|---|---|---|
| `content` | string | The content of the toast |
| `header` | string | The header of the toast |
| `markup` | ToastType | Changes the color of the toast: default, success, warning, error |
| `closeable` | boolean | Allows to close the toast before auto-closure time |
| `auto-closure` | integer | Optional closure time in ms |

### Bottom Sheet

The Bottom Sheet component slides up a panel from the bottom of the screen. On desktop it centers as a floating panel. Supports drag-to-dismiss, snap heights, header/footer slots, and an optional close button.

| Option | Type | Default | Description |
|---|---|---|---|
| `content` | string | — | HTML content rendered inside the sheet body |
| `header` | string | — | Optional header text |
| `footer` | string | — | Optional footer HTML (e.g. action buttons) |
| `closeable` | boolean | `true` | Shows a close button and enables backdrop/Escape dismissal |
| `snapHeight` | string | `'auto'` | Height preset: `'auto'`, `'half'` (50vh), or `'full'` (100dvh) |
| `onClose` | function | — | Callback fired after the dismiss animation completes |

``` js
const sheet = new BottomSheet({
    content: '<p>Sheet content here.</p>',
    header: 'Title',
    footer: '<div class="buttons"><button>Cancel</button><button>Confirm</button></div>',
    snapHeight: 'half',
    onClose: () => console.log('closed'),
});
sheet.show();
sheet.hide();
sheet.snapTo('full');
```

### Lightbox

The Lightbox component opens images in a fullscreen overlay with an optional gallery mode. Supports keyboard navigation (← →, Escape), touch swipe, click-to-zoom, adjacent image preloading, focus trap, and a static `bind()` method for declarative HTML wiring.

| Option | Type | Default | Description |
|---|---|---|---|
| `src` | string | — | Image URL for single-image mode |
| `alt` | string | — | Alt text for the image |
| `caption` | string | — | Optional caption below the image |
| `images` | LightboxImage[] | — | Array of `{ src, alt?, caption? }` for gallery mode |
| `startIndex` | number | `0` | Starting index when opening a gallery |
| `closeable` | boolean | `true` | Shows × button and enables backdrop/Escape dismissal |
| `onOpen` | function | — | Callback fired when the lightbox opens |
| `onClose` | function | — | Callback fired after the close animation completes |

``` js
import { Lightbox } from '@dodlhuat/basix/js/lightbox.js';

// Single image
new Lightbox({ src: 'photo.jpg', alt: 'A landscape', caption: 'Taken at sunrise' }).show();

// Gallery
new Lightbox({
    images: [
        { src: 'photo1.jpg', alt: 'Photo 1', caption: 'Day one' },
        { src: 'photo2.jpg', alt: 'Photo 2' },
    ],
    startIndex: 0,
    onClose: () => console.log('closed'),
}).show();

// Declarative binding — groups elements by data-lightbox value into galleries
Lightbox.bind();
```

``` html
<!-- Declarative usage -->
<a href="full.jpg" data-lightbox="trip" data-lightbox-caption="Arrival day">
    <img src="thumb.jpg" alt="Arrival" />
</a>
```

### Tooltip

The Tooltip component shows contextual information on hover.

``` html
<button class="tooltip-trigger" data-tooltip="This is a simple tooltip">Hover me</button>
```

### Spinner / Loading

The Spinner component shows simple loading indicators. There are two variants: a simple spinner and a loading indicator with dots.

``` html
<div class="spinner"></div>
<div class="loading"></div>
```

---

## Components

### Alerts

The Alert component displays contextual feedback messages. Available variants: default, error, warning and success.

``` html
<div class="alert alert-error"><strong>Error: </strong> This is an error alert!</div>
```

### Buttons

The Button component provides styled buttons with variants. Use the `.button` class on divs or simply the `button` element with color classes: `button-primary`, `button-success`, `button-warning`, `button-error`.

``` html
<button class="button-primary">Primary</button>
```

### Chips

The Chips component displays small interactive elements like tags or filters. CSS only. Use listeners if you want them to be clickable or closeable.

``` html
<div class="chips">
    <div class="chip">Example Chip</div>
    <div class="chip clickable">Clickable Chip</div>
    <div class="chip closeable">
        Closeable Chip
        <button class="close"><span class="icon icon-close"></span></button>
    </div>
</div>
```

### Badge

The Badge component displays compact status labels or counts inline. CSS only. Supports soft (tinted), solid, and outline variants, three sizes, and a dot-only indicator.

``` html
<!-- Soft (default) -->
<span class="badge badge-info">Info</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>

<!-- Solid fill -->
<span class="badge badge-solid badge-info">Info</span>

<!-- Outline -->
<span class="badge badge-outline badge-error">Error</span>

<!-- Sizes -->
<span class="badge badge-sm badge-info">Small</span>
<span class="badge badge-lg badge-info">Large</span>

<!-- Dot indicator (no text) -->
<span class="badge badge-dot badge-success"></span>
```

### Stepper

The Stepper component guides users through a multi-step process. Supports horizontal and vertical layouts, animated connector fills, active pulse, completed, and error states. Steps can optionally be made clickable for non-linear navigation.

``` html
<div class="stepper" id="my-stepper">
    <div class="stepper-step completed">
        <div class="stepper-indicator">
            <svg class="icon-svg"><use href="svg-icons/icons.svg#check"/></svg>
        </div>
        <div class="stepper-label">
            <span class="stepper-title">Account</span>
            <span class="stepper-desc">Your details</span>
        </div>
    </div>
    <div class="stepper-connector completed"></div>
    <div class="stepper-step active">
        <div class="stepper-indicator">2</div>
        <div class="stepper-label">
            <span class="stepper-title">Profile</span>
        </div>
    </div>
    <div class="stepper-connector"></div>
    <div class="stepper-step">
        <div class="stepper-indicator">3</div>
        <div class="stepper-label">
            <span class="stepper-title">Review</span>
        </div>
    </div>
</div>
```

Add `.stepper-vertical` to the container for a vertical layout.

``` js
const stepper = new Stepper('#my-stepper', {
    defaultStep: 0,   // initial active step (0-based)
    clickable: true,  // allow clicking completed steps to navigate back
    onChange: (current, previous) => console.log(current, previous),
});

stepper.next();
stepper.prev();
stepper.goTo(2);
stepper.setError(1);
stepper.clearError(1);
stepper.isFirst();   // boolean
stepper.isLast();    // boolean
stepper.getStep();   // current index
stepper.getStepCount();
```

| Option | Type | Default | Description |
|---|---|---|---|
| `defaultStep` | number | `0` | Index of the initially active step |
| `clickable` | boolean | `false` | Adds `.stepper-clickable` and wires click-to-navigate on all steps |
| `onChange` | function | — | Callback fired on step change: `(current, previous) => void` |

### Accordion

The Accordion component creates collapsible content sections. Uses hidden radio/checkbox inputs with labels and is CSS only.

``` html
<div class="accordion">
    <div class="accordion-item">
        <input type="radio" name="accordion" id="acc1" class="accordion-input" checked />
        <label for="acc1" class="accordion-label">Section Title</label>
        <div class="accordion-content">
            <div class="accordion-body"><div><p>Content here.</p></div></div>
        </div>
    </div>
</div>
```

### Tabs

The Tabs component creates accessible tabbed interfaces. Supports horizontal/vertical layouts, keyboard navigation (arrow keys, Home, End), and ARIA attributes.

| Option | Type | Default | Description |
|---|---|---|---|
| `layout` | string | `'horizontal'` | Layout of the tabs, either `'horizontal'` or `'vertical'` |
| `defaultTab` | integer | `0` | Index of the default active tab (0-based) |

### Timeline

The Timeline component displays chronological events. CSS only.

``` html
<div class="timeline">
    <div class="timeline-item active">
        <div class="timeline-content">
            <span class="timeline-date">October 12, 2023</span>
            <h3 class="timeline-title">Event Title</h3>
            <p class="timeline-body">Event description.</p>
        </div>
    </div>
</div>
```

### Progress Bar

The Progress Bar component displays task completion.

``` html
<div class="progress-bar">
    <div class="progress" style="height: 24px; width: 50%"></div>
</div>
```

### Placeholder / Skeleton

The Placeholder component creates skeleton loading states. Use `.placeholder` with width classes `.w-1` through `.w-12` (12-column grid). Animates with a pulsing fade effect.

``` html
<span class="placeholder w-6"></span>
```

---

## Advanced Components

### Chart

The Chart component renders SVG-based charts with no external dependencies. Supports line, area, column, bar, and pie chart types. Animates on first render and redraws on container resize.

``` js
const chart = new Chart('#chart-container', {
    type: 'line',
    title: 'Monthly Revenue',
    series: [
        {
            name: 'Product A',
            data: [
                { label: 'Jan', value: 120 },
                { label: 'Feb', value: 180 },
                { label: 'Mar', value: 150 },
            ],
        },
    ],
});

chart.update(newSeries);   // replace data and redraw
chart.setType('bar');      // switch chart type
chart.destroy();           // remove listeners and DOM
```

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | ChartType | — | `'line'`, `'area'`, `'column'`, `'bar'`, or `'pie'` |
| `series` | ChartSeries[] | — | Array of `{ name, data, color? }` objects |
| `title` | string | — | Optional chart title |
| `subtitle` | string | — | Optional subtitle below the title |
| `height` | number | `280` | Inner chart height in px |
| `showLegend` | boolean | `true` | Renders the series legend |
| `showGrid` | boolean | `true` | Renders background grid lines |
| `animate` | boolean | `true` | Animates on first render |
| `curve` | string | `'smooth'` | Line interpolation for line/area: `'smooth'`, `'linear'`, `'step'` |
| `yMin` | number | `0` | Fixed y-axis minimum |
| `yMax` | number | auto | Fixed y-axis maximum (defaults to max value × 1.1) |
| `onPointClick` | function | — | Callback `(series, point, index) => void` fired on data point click |

### Calendar

The Calendar component renders a full interactive calendar with month, week, and agenda views. Supports event display, keyboard navigation, and locale configuration.

``` js
const cal = new Calendar({
    container: '#my-calendar',
    view: 'month',
    events: [
        {
            id: '1',
            title: 'Team Meeting',
            start: new Date(2026, 3, 20, 10, 0),
            end:   new Date(2026, 3, 20, 11, 0),
            className: 'badge-success',
        },
    ],
    onEventClick: (event) => console.log(event),
    onDayClick:   (date)  => console.log(date),
    onChange:     (date, view) => console.log(date, view),
});

cal.next();
cal.prev();
cal.today();
cal.setView('week');
cal.addEvent({ id: '2', title: 'Lunch', start: new Date(), end: new Date() });
cal.removeEvent('2');
cal.setEvents(events);
cal.getEvents();
cal.destroy();
```

| Option | Type | Default | Description |
|---|---|---|---|
| `container` | HTMLElement \| string | — | Target container element or CSS selector |
| `events` | CalendarEvent[] | `[]` | Initial events |
| `view` | string | `'month'` | Initial view: `'month'`, `'week'`, or `'agenda'` |
| `showOutsideDays` | boolean | `true` | Show days from adjacent months in the month grid |
| `locale` | object | — | Override locale strings (day names, month names, labels) |
| `onDayClick` | function | — | Callback `(date: Date) => void` |
| `onEventClick` | function | — | Callback `(event: CalendarEvent) => void` |
| `onChange` | function | — | Callback `(date: Date, view: CalendarView) => void` |
| `className` | string | — | Extra CSS class on the root element |

### Context Menu

The Context Menu component shows a custom right-click menu on any target element. Supports icons, keyboard shortcuts, group labels, separators, submenus, destructive items, and disabled items. Automatically flips to avoid viewport overflow and animates in from the click origin.

``` js
new ContextMenu('.my-element', [
    { group: 'File' },
    { label: 'Open',   icon: 'folder_open', shortcut: '⌘O', action: (target) => {} },
    { label: 'Rename', icon: 'edit',        shortcut: 'F2', action: (target) => {} },
    'separator',
    {
        label: 'Share', icon: 'send',
        submenu: [
            { label: 'Copy link',    icon: 'attachment', action: (target) => {} },
            { label: 'Send by mail', icon: 'mail',       action: (target) => {} },
        ]
    },
    'separator',
    { label: 'Delete', icon: 'delete', destructive: true, action: (target) => {} },
]);
```

The constructor accepts a CSS selector string, a single `HTMLElement`, or an array of `HTMLElement`s as the first argument.

#### Item types

| Type | Shape | Description |
|---|---|---|
| Action item | `ContextMenuItemDef` | Regular clickable item |
| Separator | `'separator'` | Horizontal divider line |
| Group label | `{ group: string }` | Non-interactive section header |

#### ContextMenuItemDef

| Property | Type | Description |
|---|---|---|
| `label` | string | Display text |
| `icon` | string | SVG sprite icon id (e.g. `'delete'`) |
| `shortcut` | string | Keyboard shortcut hint shown on the right (e.g. `'⌘O'`) |
| `disabled` | boolean | Renders item at reduced opacity, non-interactive |
| `destructive` | boolean | Renders item in error/red color |
| `action` | function | Callback `(target: HTMLElement) => void` — receives the right-clicked element |
| `submenu` | `ContextMenuInput[]` | Nested items; renders a submenu on hover |

#### Keyboard navigation

| Key | Action |
|---|---|
| `↑` / `↓` | Move focus between items |
| `Enter` | Activate focused item |
| `Escape` | Close the menu |

### Data Tables

The Table component provides sortable, searchable, and paginated data tables. It can parse existing HTML tables or accept data programmatically.

### Date Picker

The DatePicker component provides a calendar interface for date selection. Supports single date or date range modes, customizable locales, and mobile-responsive design.

#### DatePicker Parameters

| Parameter | Type | Description |
|---|---|---|
| `input` | HTMLInputElement \| string | The input element to attach the date picker to |
| `options` | DatePickerOptions | Configuration options for the date picker (see options table) |
| `currentDate` | Date | The current date to be displayed; defaults to today's date |
| `selectedDate` | Date | The selected date; defaults to null |
| `rangeStart` | Date | The start of a selected date range; defaults to null |
| `rangeEnd` | Date | The end of a selected date range; defaults to null |
| `viewYear` | number | The year currently displayed; defaults to the current year |
| `viewMonth` | number | The month currently displayed; defaults to the current month |
| `viewMode` | ViewMode | The view mode (`'days'` \| `'months'` \| `'years'`); defaults to `'days'` |
| `yearRangeStart` | number | The start of the year range; defaults to this year |

#### DatePickerOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | string | `'single'` | Mode of the date picker, either `'single'` or `'range'` |
| `startDay` | number | `0` | Start day of the week (0 = Sunday, 1 = Monday, etc.) |
| `locales` | DatePickerLocales | — | Locales object containing a `days` array and a `months` array with localized names |
| `format` | `(date: Date) => string` | — | Function to format the date for display; defaults to `'YYYY-MM-DD'` |
| `onSelect` | `(date: Date \| DateRange) => void` | — | Callback when a date is selected |

### Tree Component

The TreeComponent renders hierarchical data as an expandable/collapsible tree. Supports file/folder icons, selection, and programmatic expand/collapse.

#### TreeComponent Parameters

| Parameter | Type | Description |
|---|---|---|
| `container` | HTMLElement \| string | The container element |
| `data` | TreeNode[] | An array of TreeNodes to render |
| `selectedNode` | TreeNode \| null | The currently selected TreeNode |

#### TreeNode

| Parameter | Type | Description |
|---|---|---|
| `label` | string | The label of the TreeNode |
| `type` | NodeType | The type of the TreeNode: `'file'` \| `'folder'` |
| `children` | TreeNode[] | An array of child TreeNodes |

### File Uploader

The FileUploader component provides drag-and-drop file upload functionality with progress indication. Supports file validation (size, type), multiple files, and upload cancellation.

### Virtual Dropdown

Virtual Dropdown is a performant, virtualized dropdown component that efficiently renders large option lists by only drawing visible items in the DOM. Supports single and multi-select modes, built-in search/filtering, keyboard navigation, and configurable item height and render limits — making it ideal for scenarios with hundreds or thousands of selectable options.

### Group Picker

The GroupPicker component enables hierarchical group and subgroup selection. Users can either select an entire parent group (covering all subgroups) or pick individual subgroups. Groups without children are directly selectable. Selecting all subgroups automatically promotes to a parent selection. Includes debounced search with match highlighting, expand/collapse, and a chip-based selection summary.

``` html
<div id="group-picker-demo"></div>
```

``` js
const data: GroupData[] = [
  {
    id: 'gruppenspiele', label: 'Gruppenspiele',
    subgroups: [
      { id: 'grossgruppe', label: 'Grossgruppenspiele' },
      { id: 'trinkspiele', label: 'Trinkspiele' },
    ]
  },
  { id: 'schach', label: 'Schach' }, // no subgroups — directly selectable
];

const picker = new GroupPicker('#group-picker-demo', data, {
  onSelectionChange: (selection) => console.log(selection),
});
```

#### GroupData

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique identifier for the group |
| `label` | string | Display name |
| `subgroups` | SubgroupData[] | Optional array of `{ id, label }` child items |

#### GroupPickerOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `onSelectionChange` | function | — | Callback fired on selection change with `GroupPickerSelection` |
| `searchPlaceholder` | string | `'Gruppen durchsuchen...'` | Placeholder text for the search input |
| `selectAllLabel` | string | `'Alle'` | Label for the select-all button |
| `deselectLabel` | string | `'Abwahlen'` | Label shown when a parent group is selected |
| `emptyLabel` | string | `'Keine Ergebnisse'` | Shown when search yields no results |
| `selectionPlaceholder` | string | `'Noch keine Auswahl getroffen'` | Placeholder in the selection summary area |

#### Public API

| Method | Description |
|---|---|
| `getSelection()` | Returns `{ parentGroups: string[], subgroups: { groupId, subgroupId }[] }` |
| `setSelection(selection)` | Programmatically set the selection state |
| `clearSelection()` | Clear all selections |
| `expandAll()` | Expand all groups |
| `collapseAll()` | Collapse all groups |
| `destroy()` | Remove event listeners and clear the DOM |

### Time Span Picker

The TimeSpanPicker component provides a paired start/end time input for selecting a time range.

``` js
const picker = new TimeSpanPicker('my-container', {
    defaultStart: '09:00',
    defaultEnd:   '17:00',
    fromString:   'Von',   // optional — defaults to 'From'
    toString:     'Bis',   // optional — defaults to 'To'
    onChange: (start, end) => console.log(start, end),
});

picker.getValue();            // { start: '09:00', end: '17:00' }
picker.setValue('10:00', '18:00');
picker.reset();
picker.isValid();             // boolean
picker.destroy();
```

### Select

The Select component wraps a native `<select>` element with custom Basix styling. Supports single and multi-select.

``` html
<select id="my-select">
    <option value="a">Option A</option>
    <option value="b">Option B</option>
</select>
```

``` js
const sel = new Select('#my-select');
sel.value();   // returns selected value string, or string[] for multi-select

// Or initialise by passing the element directly
Select.init(document.querySelector('#my-select'));
```

### Code Viewer

The CodeViewer component renders syntax-highlighted code blocks inside any container. Supports JavaScript, HTML, and CSS.

``` js
new CodeViewer('#output', '<div class="card">Hello</div>', 'html');
new CodeViewer('#output', 'const x = 42;', 'javascript');
new CodeViewer('#output', '.card { padding: 1rem; }', 'css');
```

### Editor

The Editor component provides a contenteditable rich-text editing area with undo/redo, word count, and an optional side panel showing the raw HTML source and a live preview. Requires a `#editable` element in the DOM.

``` html
<div id="editable" contenteditable="true"></div>
<!-- Optional side panel elements -->
<textarea id="code"></textarea>
<div id="preview"></div>
<div id="sidePanel"></div>
<span id="wordCount"></span>
```

``` js
// Full editor with side panel
new Editor();

// Simple mode — hides the side panel permanently
new Editor({ simple: true });
```

### Custom Scrollbar

The Scrollbar component creates custom-styled scrollbars. Supports pointer/touch dragging, track clicking, and automatic thumb sizing. Can be used with any class.

``` html
<div class="scroll-container" style="height: 100px">
    <div class="viewport">
        <div class="content">...</div>
        <div class="scrollbar" aria-hidden="true">
            <div class="track">
                <div class="thumb" role="presentation" aria-hidden="true"></div>
            </div>
        </div>
    </div>
</div>
```

### Chat Bubbles

The Chat Bubbles component styles messaging interfaces.

``` html
<div class="chat-container">
    <div class="message message-incoming">
        Hello!
        <span class="message-meta">10:42 AM</span>
    </div>
    <div class="message message-outgoing">
        Hi there!
        <span class="message-meta">10:43 AM</span>
    </div>
</div>
```

### Carousel

The Carousel component creates image/content sliders with navigation buttons and dot indicators. Supports loop mode, autoplay, and touch/swipe gestures.

``` html
<div class="carousel" id="carouselIdHere">
    <div>Slide 1</div>
    <div>Slide 2</div>
    <div>Slide 3</div>
</div>
```

### Gallery

A responsive, infinite-scroll masonry gallery that dynamically arranges image cards into columns. The layout automatically adapts to the viewport width, redistributing items into the shortest column for a balanced, Pinterest-style grid. Cards feature lazy-loaded images with a smooth fade-in effect, titles, and descriptions. Scroll to the bottom to load more content — fetching can be throttled with a configurable reload limit to prevent runaway requests.

#### Constructor Parameters

| Parameter | Type | Description |
|---|---|---|
| `containerId` | string | The `id` of the HTML element that will serve as the gallery container. Throws an error if not found in the DOM. |
| `options` | MasonryGalleryOptions | Optional configuration object to customise the gallery's layout and behaviour. Defaults to `{}`. |

#### MasonryGalleryOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `minColumnWidth` | number | `250` | Minimum width (in pixels) for each masonry column. The number of columns is calculated by dividing the available container width by this value. |
| `scrollThreshold` | number | `100` | Distance from the bottom of the page (in pixels) at which the next batch of images is fetched. |
| `loaderSelector` | string | `'.loader'` | CSS selector for the loading-indicator element. Shown/hidden automatically during fetch cycles via a `hidden` class toggle. |
| `reload` | number | `2` | Maximum number of times new images can be fetched via infinite scroll. Once the limit is reached, further scroll events are ignored. |
| `fetchFunction` | `Promise<ImageData[]>` | — | A promise that resolves to an array of `ImageData` objects (`{ src, title, desc }`). Required in practice — the built-in fallback throws an error. |

---

## Utilities

### Theme Toggle

The Theme component manages light/dark mode switching. Persists preference to localStorage, respects system preference, and supports keyboard shortcut (Ctrl/Cmd+J). Any element with id `theme-toggle` can work as a switch.

### Scroll Utility

The Scroll utility allows to scroll to elements in the DOM. You can scroll to any class or id element.

``` js
window.Scroll.to('#my-element');
```

---

## How to Run Locally

Building is only necessary if you want to make changes to files. Otherwise, docker is enough.

```bash
# Docker
docker compose up -d
# → http://localhost:8082

# Compile TypeScript
# One-time compilation (all .ts files in js/)
npx tsc -p js/tsconfig.json
# Watch mode (auto-recompile on changes)
npx tsc -p js/tsconfig.json --watch
# Or use the shorter alias:
tsc -p js/tsconfig.json -w

# Compile SCSS to CSS
# Install sass first: npm install -g sass
sass css:css
# Or with watch mode:
sass --watch css:css
# Or compile + minify the main bundle:
sass --style=compressed css/style.scss css/style.min.css
```
