# 🎨 Custom Viewer Engine

The **Custom Viewer Engine** is one of Network Spy's most powerful "Superpowers." It allows you to move beyond generic JSON or XML trees and build specialized visualizers tailored to your application's specific data structures.

---

## 💡 Why This Feature?

In modern application development, data transmitted over the wire is rarely simple. It is often heavily nested, encoded in custom formats, or follows complex schemas like Protobuf or SOAP. 

Standard network sniffers show you raw text or basic trees, forcing you to manually hunt for the data you need. The Custom Viewer Engine solves this by allowing you to create a UI that understands your data, making debugging faster and less error-prone.

---

## 🛠️ What It Can Create

With the Custom Viewer Engine, you can build:
- **Tailored Layouts**: Arrange data fields in a way that makes sense for your workflow.
- **Custom Parsers**: Automatically decode specific fields, highlight tracking IDs, or parse complex structures.
- **Interactive Widgets**: Create visual representations for complex data types (e.g., progress bars for status fields, formatted dates, or image previews).
- **Validation Rules**: Highlight anomalies or missing fields in the payload automatically.

---

## 🐛 Issues It Solves During Debugging

- **Information Overload**: Stop scrolling through thousands of lines of JSON to find one status code.
- **Cognitive Load**: Stop mentally decoding timestamps, base64 strings, or complex enums.
- **Hydration & Layout Issues**: Standard viewers often struggle with very large or deeply nested payloads. Custom viewers can be optimized to render only what you need.
- **Repetitive Tasks**: Automate the extraction of data you look at every day.

---

## 🏗️ How to Create: Manual vs AI

The Custom Viewer feature is available on **all plans**, including the Free plan. However, there are differences in capabilities and limits depending on your account:

### 1. Manual Builder (Drag-and-Drop)

For complete control, use the built-in **Block Builder** to create viewers manually.
- Open the **Custom Viewer Builder** from the workspace.
- Drag blocks (Text, Grid, Card, Chart, etc.) onto the canvas.
- Map blocks to specific paths in your JSON/XML payload using simple dot notation.
- Save and apply to matching requests.
- **Limits**: Free plan users can create a maximum of **1 custom viewer**. Upgrade to Personal or Pro for unlimited viewers.

### 2. AI Generator

You can leverage AI to build viewers in seconds instead of creating them manually. This feature is available on all plans but with different capabilities:
- **Free**: Can use AI with the default model. Limited to 1 viewer.
- **Personal**: Unlimited viewers, can change the AI model.
- **Pro**: Unlimited viewers, can change the AI model, and can use custom providers (custom base URL).

- **How to Use**:
    1. Select a request with the payload you want to visualize.
    2. Open the Custom Viewer Builder and select the **AI Assistant** tab.
    3. Describe what you want to see (e.g., *"Show me the user profile data in a card grid, and highlight the subscription status"*).
    4. The AI will analyze the payload and automatically generate the layout and mapping logic for you.
- *Note: This feature requires an AI Provider API key (e.g., OpenRouter) configured in Settings.*

---

## 🚀 Maximizing Custom Viewer for Day-to-Day Workflow

To get the most out of this feature:

1. **Build a Team Library**: Share your custom viewers with your team. If one person builds a great viewer for your internal API, everyone should use it.
2. **Use Conditional Logic**: Set up viewers to only appear for specific endpoints or when specific fields are present.
3. **Combine with Breakpoints**: Use custom viewers to inspect state when a breakpoint is hit, making it immediately clear what went wrong.
4. **Iterate**: Start simple. Build a viewer for the 3 fields you check most often, and add more blocks as your debugging needs evolve.

---

## 💬 Community

Have questions or want to share your custom viewers? **Pro users** receive an invite to our exclusive Discord group via email. Join the discussion, share your templates, and get help from the community!
