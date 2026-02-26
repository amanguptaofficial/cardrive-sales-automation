import OpenAI from 'openai';
import { LeadTier, Sentiment } from '../enums/index.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

const getTierFromScore = (score) => {
  if (score >= 85) return LeadTier.HOT;
  if (score >= 55) return LeadTier.WARM;
  return LeadTier.COLD;
};

export const scoreLead = async (lead) => {
  try {
    const prompt = `You are an automotive sales AI. Analyze this lead and return a JSON score.

Lead Data:
- Name: ${lead.name}
- Car Interest: ${lead.interest?.make || 'N/A'} ${lead.interest?.model || 'N/A'} ${lead.interest?.variant || ''}
- Budget: ₹${lead.interest?.budget?.min || 'not stated'} – ₹${lead.interest?.budget?.max || 'not stated'}
- Finance Required: ${lead.interest?.financeRequired ? 'Yes' : 'No/Unknown'}
- Location: ${lead.location?.city || 'N/A'}, ${lead.location?.area || 'N/A'}
- Source: ${lead.source}
- Message: "${lead.firstMessage || 'No message'}"
- Contact: email=${!!lead.email}, phone=${!!lead.phone}

Score 0-100 based on:
+20  Budget is clearly specified
+15  Specific car model/variant requested (not just "any SUV")
+20  Urgency signals ("this month", "urgent", "ASAP", "by Diwali")
+15  Finance pre-approval or willingness mentioned
+10  Both email AND phone provided
+10  Premium model (luxury / flagship) = higher margin
+10  Specific location provided

Return ONLY valid JSON:
{
  "score": 87,
  "tier": "hot",
  "reasoning": "Very specific Fortuner 4x4 request with clear ₹32L budget...",
  "signals": ["specific model", "clear budget", "urgency word", "both contacts"],
  "sentiment": "positive",
  "suggestedAction": "Assign senior agent, call within 30 minutes"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a JSON-only response AI. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content);
    result.tier = getTierFromScore(result.score);
    
    return result;
  } catch (error) {
    logger.error('AI scoring error:', error);
    return {
      score: 50,
      tier: LeadTier.COLD,
      reasoning: 'AI scoring failed, using default score',
      signals: [],
      sentiment: Sentiment.NEUTRAL,
      suggestedAction: 'Review manually'
    };
  }
};

export const generateResponse = async (lead) => {
  try {
    let agentName = 'CarDrive Team';
    if (lead.assignedTo) {
      if (typeof lead.assignedTo === 'object' && lead.assignedTo.name) {
        agentName = lead.assignedTo.name;
      } else {
        agentName = 'CarDrive Team';
      }
    }

    const systemPrompt = `You are a warm, helpful sales assistant at CarDrive Motors, a premium car dealership.
Your goal: engage the lead personally, acknowledge their specific car interest,
and guide them toward a test drive or call.

Rules:
- Under 120 words. Not too salesy.
- Always mention their car model by name.
- Include exactly ONE clear CTA (test drive / call / visit showroom).
- If they asked about finance, mention "easy EMI options".
- Tone: friendly professional. Use 1–2 emojis max.
- Never make up prices. Say "let me share the exact quote" instead.
- If it's after 8 PM or before 9 AM, acknowledge: "Thanks for reaching out! Let me..."
- IMPORTANT: End the message with "Best regards, [Agent Name] at CarDrive Motors" where [Agent Name] is the assigned agent's name.`;

    const userPrompt = `Lead Name: ${lead.name}
Car: ${lead.interest?.make || 'N/A'} ${lead.interest?.model || 'N/A'}
Budget: ₹${lead.interest?.budget?.max || 'not specified'}
Their message: "${lead.firstMessage || 'No message'}"
Finance needed: ${lead.interest?.financeRequired ? 'Yes' : 'Unknown'}
AI Score: ${lead.score} (${lead.tier})
Assigned Agent Name: ${agentName}

Write the WhatsApp message. End with "Best regards, ${agentName} at CarDrive Motors".`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    let content = response.choices[0].message.content;
    
    content = content.replace(/\[Your Name\]/gi, agentName);
    content = content.replace(/\[Agent Name\]/gi, agentName);
    content = content.replace(/your name/gi, agentName);
    
    if (!content.includes(agentName) && !content.includes('CarDrive')) {
      content = content.trim() + `\n\nBest regards,\n${agentName} at CarDrive Motors`;
    }
    
    const tags = [];
    if (lead.interest?.model) tags.push('Model Matched');
    if (content.toLowerCase().includes('test drive')) tags.push('Test Drive CTA');
    if (content.toLowerCase().includes('finance') || content.toLowerCase().includes('emi')) tags.push('Finance Mention');

    return { content, tags };
  } catch (error) {
    logger.error('AI response generation error:', error);
    
    let fallbackAgentName = 'CarDrive Team';
    if (lead.assignedTo) {
      if (typeof lead.assignedTo === 'object' && lead.assignedTo.name) {
        fallbackAgentName = lead.assignedTo.name;
      }
    }
    
    return {
      content: `Hi ${lead.name}! Thanks for your interest in ${lead.interest?.model || 'our vehicles'}. We'd love to help you find the perfect car. Would you like to schedule a test drive?\n\nBest regards,\n${fallbackAgentName} at CarDrive Motors`,
      tags: []
    };
  }
};

export const regenerateResponse = async (lead, tone = 'friendly') => {
  try {
    let agentName = 'CarDrive Team';
    if (lead.assignedTo) {
      if (typeof lead.assignedTo === 'object' && lead.assignedTo.name) {
        agentName = lead.assignedTo.name;
      }
    }

    const toneInstructions = {
      urgent: 'Make it more urgent and time-sensitive',
      friendly: 'Make it warmer and more conversational',
      professional: 'Make it more formal and business-like'
    };

    const systemPrompt = `You are a warm, helpful sales assistant at CarDrive Motors. ${toneInstructions[tone] || toneInstructions.friendly}.
IMPORTANT: End the message with "Best regards, [Agent Name] at CarDrive Motors" where [Agent Name] is the assigned agent's name.`;

    const userPrompt = `Lead Name: ${lead.name}
Car: ${lead.interest?.make || 'N/A'} ${lead.interest?.model || 'N/A'}
Budget: ₹${lead.interest?.budget?.max || 'not specified'}
Their message: "${lead.firstMessage || 'No message'}"
AI Score: ${lead.score} (${lead.tier})
Assigned Agent Name: ${agentName}

Write a new WhatsApp message with a different angle. End with "Best regards, ${agentName} at CarDrive Motors".`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.8
    });

    let content = response.choices[0].message.content;
    
    content = content.replace(/\[Your Name\]/gi, agentName);
    content = content.replace(/\[Agent Name\]/gi, agentName);
    content = content.replace(/your name/gi, agentName);
    
    if (!content.includes(agentName) && !content.includes('CarDrive')) {
      content = content.trim() + `\n\nBest regards,\n${agentName} at CarDrive Motors`;
    }
    
    const tags = [];
    if (lead.interest?.model) tags.push('Model Matched');
    if (content.toLowerCase().includes('test drive')) tags.push('Test Drive CTA');
    if (content.toLowerCase().includes('finance') || content.toLowerCase().includes('emi')) tags.push('Finance Mention');

    return { content, tags };
  } catch (error) {
    logger.error('AI regeneration error:', error);
    
    let agentName = 'CarDrive Team';
    if (lead.assignedTo) {
      if (typeof lead.assignedTo === 'object' && lead.assignedTo.name) {
        agentName = lead.assignedTo.name;
      }
    }
    
    return {
      content: `Hi ${lead.name}! Thanks for your interest. We'd love to help you find the perfect ${lead.interest?.model || 'vehicle'}. Would you like to schedule a test drive?\n\nBest regards,\n${agentName} at CarDrive Motors`,
      tags: []
    };
  }
};
