# OmniMind Privacy and Data Controls

## Product Commitment

OmniMind collects only the information needed to authenticate an account, deliver the requested AI feature, preserve the user’s saved workspace, and enforce selected plan limits. The initial release does not provide autonomous agents, video generation, advertising profiles, or a marketplace of model providers. The application uses a focused catalog of models and clearly describes each stored data category inside the account area.

## Data Categories and Purpose

| Data category | Why OmniMind uses it | User control |
|---|---|---|
| Account identifier and display information | Sign-in, account access, and associating workspace content with the correct person. | Users can sign out or request account deletion from the account area. |
| Conversations and projects | Preserve saved work across devices and allow users to organize it. | Users can delete individual items or delete all account data. |
| Uploaded documents | Answer a user’s explicit question about a selected document. | Users can remove the document record from the workspace. |
| Voice recordings | Convert a user’s explicit voice request to text. | Recordings are treated as temporary input and are not retained after transcription unless the user explicitly attaches them to a project. |
| Usage events | Apply Free and Premium plan limits fairly. | The dashboard shows the current period and remaining allowance. |

## Storage, Access, and Retention

Workspace data is scoped to the authenticated account on every protected server route. Account-session tokens are held in secure platform storage on mobile devices and secure HTTP-only cookies on the web. The app retains saved projects, conversations, and document references **until the user deletes them or deletes the account**. The initial release has no hidden behavioural profiling and does not sell or use workspace content for advertising.

Uploads are stored through the project’s managed storage service. Removing an uploaded document deletes its workspace reference and makes the object inaccessible from OmniMind; underlying infrastructure-level retention may continue under the storage provider’s operational policies. This limitation is shown in the privacy controls rather than concealed.

## Account Deletion

The account screen offers a destructive **Delete account data** action. It removes the user’s application records, including projects, conversations, document references, preferences, and usage history. Authentication identity management is handled by the configured sign-in provider and may require a separate provider-level action to remove the login identity itself.

## Security Boundaries

OmniMind validates request payloads, applies authenticated authorization checks to user content, uses server-side AI credentials only, and limits uploaded document types and sizes. It does not expose model credentials in the mobile client. The app should not be used to store highly sensitive regulated records unless a future release provides the required compliance, audit, and enterprise controls.
