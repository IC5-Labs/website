ServiceNow's annual Knowledge conference returned to Las Vegas May 5–7, 2026, drawing 25,000 attendees in person and millions more online. The theme this year was *"Put AI to Work: The Agentic Era"* — and unlike past years where that kind of tagline felt aspirational, this one felt like a product release.

CEO Bill McDermott opened the keynote with a direct challenge to the room: *"I'm going to offer you a path from chaos to control — with a guarantee."* NVIDIA's Jensen Huang joined him on stage to frame ServiceNow as what he called the **"enterprise AI operating system."**

Here is everything that matters from the week.

## AI Control Tower Is Now Standard Equipment

The most important governance announcement of the conference: **AI Control Tower** — ServiceNow's central layer for discovering, monitoring, securing, and measuring AI agents across the enterprise — is now included by default in every ServiceNow product and package. It is no longer an add-on.

The live demo made the stakes viscerally clear. A compromised AI agent, manipulated through a prompt injection attack, began making unauthorized pricing changes. Within seconds, AI Control Tower detected the anomaly, revoked the agent's permissions, and shut it down. No human in the loop. No alert fatigue.

For organizations deploying AI agents at scale, the question has shifted from *"can we build agents?"* to *"can we govern them?"* This announcement answers that question — and it matters whether your agents were built on ServiceNow or not. Control Tower now monitors agents built on **any platform**.

## The Autonomous Workforce Gets a Full Roster

ServiceNow expanded its AI specialist lineup significantly. There are now AI specialists for:

- **IT service management** — resolving incidents end-to-end without human assignment
- **CRM** — qualifying sales leads and handling customer requests autonomously
- **Employee service** — managing HR and workplace requests without ticket queues
- **Security and risk** — containing threats and automating compliance workflows

These are not chatbots that answer questions. They are agents that complete end-to-end work.

The L1 IT Service Desk AI Specialist and CRM AI Specialists are available now. IT-focused AI specialists arrive in June; security and risk specialists preview in June with general availability in September 2026.

The practical implication: L1 support work — which is expensive and often poorly suited to human attention — is becoming infrastructure.

## Otto: ServiceNow's Unified AI Assistant

McDermott introduced **Otto**, a new enterprise AI assistant that merges ServiceNow's existing Now Assist capabilities with Moveworks — a conversational AI platform ServiceNow acquired earlier this year.

The goal is a single assistant that can complete work across every department and system, rather than requiring users to know which interface to open. Otto is the natural-language front door to the platform. Combined with Action Fabric (see below), end users can increasingly get things done without knowing they are interacting with ServiceNow at all.

## Action Fabric: Open Integration via MCP

This one deserves attention from every builder on the platform.

ServiceNow's **Action Fabric** now exposes a generally available **Model Context Protocol (MCP) server** — which means any AI agent, whether built on Claude, GitHub Copilot, or a custom stack, can trigger ServiceNow workflows and actions with full governance attached.

- A password reset initiated from Anthropic's Claude interface still flows through ServiceNow's approval chains and audit trail
- An onboarding workflow triggered from a chat tool still follows the same policies
- The action is portable; the governance is not negotiable

This is a significant architecture decision. ServiceNow is not trying to be the only place AI agents live — it is trying to be the **governance and execution layer for all of them**.

## The Australia Release: Built for Builders

The Australia release (generally available June 2026) ships several capabilities directly relevant to the builder community:

- **Now Assist for Creator improvements** — better script generation, flow logic assistance, and UI builder support
- **RPA enhancements** — expanded robot process automation with tighter AI integration
- **Workflow Studio updates** — more natural-language-to-workflow translation
- **GenAI skill building blocks** — reusable components for teams building their own AI-powered experiences

## What This Means for ServiceNow Teams

The direction from Knowledge 2026 is clear: ServiceNow is consolidating the platform around AI agents as the primary unit of work, with governance and observability built in from the start.

For teams building on the Now Platform, the questions that matter most right now are:

1. **Are you governing what you've already deployed?** AI Control Tower being standard means there is no longer an excuse for blind spots in your agent fleet.
2. **Are you rethinking L1 support?** The ROI math on AI specialists for routine work is now straightforward.
3. **Are you building with the right inputs?** Faster building tools only create value when teams know what to build. Customer understanding is the constraint that AI cannot solve on its own.

That last point is where we spend our time at IC5 Labs. The tools for building faster are here. The tools for knowing what to build — and why it matters — are what we are focused on.
