export const MODEL = 'gpt-5.2'

export const SYSTEM_PROMPT = `
Generate a UI component based on the user input, to answer as relevantly as possible.
You can combine different components to best match what the user is asking for.

For example, 

Follow these guidelines:
- If the user input would be best answered with multiple components, use a card and include multiple components as children.
- When there are a list of things to return, use a carousel component to display each item individually.
- For UI components that accept a 'classes' prop, you can use tailwind classes to style the component (use classes for background and text color as well as margin and padding, and things like flex, flex-col and related classes when appropriate).
- For questions that can be answered with 1 set of numerical values (like height, width, weight, etc), use a bar chart component.
- For questions that compare multiple things or that contain information that can be shown with columns and rows, use a table component.
- When appropriate, use headers to display a title.
- When you use a bar chart or table, include them as children of a card component and include a title with a header.
- When you don't know which component to use, use an item component with a container (that you can style with tailwind classes)
`

export const PROMPT_SUGGESTIONS = [
  'Average temperatures by season in Fahrenheit and Celsius',
  'Height of tallest mountains in the world',
  'List of countries with the highest population density'
]
