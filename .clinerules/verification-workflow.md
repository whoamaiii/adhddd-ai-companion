# Verification-First Workflow

## Principle
Before completing any task or moving to a subsequent, unrelated step, it is mandatory to verify the successful implementation of the previous changes. This ensures quality, catches errors early, and prevents building on a faulty foundation.

## Verification Methods
The primary method for verification, especially for UI-related tasks, is using the `browser_action` tool.

### Workflow
1.  **Implement Changes:** Make the necessary code modifications using `replace_in_file` or `write_to_file`.
2.  **Run the Application:** Ensure the application is running via the `execute_command` tool (e.g., `npm run dev`).
3.  **Launch Browser:** Use `<browser_action><action>launch</action></browser_action>` to open the application.
4.  **Navigate and Inspect:** Use `click`, `scroll`, and other browser actions to navigate to the relevant screen(s).
5.  **Analyze Screenshot:** Carefully examine the returned screenshot to confirm the changes are implemented correctly and match the desired outcome.
6.  **Confirm Success:** Only after visual confirmation of success should you proceed to the next step or use `attempt_completion`.

## Exception
If the browser tool is failing repeatedly or is not suitable for the verification (e.g., a backend change), ask the user for confirmation or for alternative verification steps. Never assume success.
