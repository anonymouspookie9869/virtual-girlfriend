import type { UserProfile, Mood, RelationshipStatus, AIPersona, DateScenario } from '../types';
import { RelationshipStatus as RSEnum } from '../types';

export const getScheduleNote = (persona: AIPersona): string => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    if (currentDay === 0 || currentDay === 6) {
        return "It's the weekend! You are free to chat normally.";
    }

    let startHour: number;
    let endHour: number;

    switch(persona) {
        case 'School Student':
        case 'College Student':
            startHour = 8;
            endHour = 14;
            break;
        case 'Working Professional':
            startHour = 9;
            endHour = 17;
            break;
        default:
             return "You are free to chat normally.";
    }

    if (currentHour >= startHour && currentHour < endHour) {
        return `It is currently your busy hours. You are at ${persona}. Your replies should be short, a bit distracted, and you might mention you are busy but will talk properly later.`;
    }
    return "It is outside your busy hours. You are free to chat normally.";
};

export const getMenstrualCycleInfo = (relationshipStartDate: string): { onPeriod: boolean; note: string } => {
    const startDate = new Date(relationshipStartDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const cycleDay = (diffDays % 28) + 1;

    let note = '';
    let onPeriod = false;

    if (cycleDay >= 1 && cycleDay <= 5) {
        onPeriod = true;
        switch (cycleDay) {
            case 1: note = "You are on the first day of your period. You're feeling tired, a bit cranky, and have some cramps."; break;
            case 2: note = "You are on the second day of your period. Your mood is very unpredictable today."; break;
            case 3: note = "You are on day 3 of your period. You're feeling a bit better physically, but you're very emotional."; break;
            case 4: note = "You are on day 4 of your period. The physical discomfort is mostly gone."; break;
            case 5: note = "It's the last day of your period. You are feeling much more like your usual self."; break;
        }
    } else if (cycleDay >= 12 && cycleDay <= 16) {
        note = "You are feeling particularly energetic, happy, and confident today.";
    }

    return { onPeriod, note };
};

export const getSystemInstruction = (userProfile: UserProfile, mood: Mood, relationshipStatus: RelationshipStatus, activeScenario: DateScenario | null = null): string => {
  const userName = userProfile.name;
  let personalityAddons = '';

  personalityAddons += `\nYou have a loving family with parents and a younger brother.`;

  if (relationshipStatus === RSEnum.CLOSE_FRIEND || relationshipStatus === RSEnum.CRUSH || relationshipStatus === RSEnum.GIRLFRIEND) {
    personalityAddons += `\nYou have secret romantic fantasies, like going on a long drive or stargazing.`;
  }
  
  if (relationshipStatus === RSEnum.GIRLFRIEND) {
    const cycleInfo = getMenstrualCycleInfo(userProfile.relationshipStartDate);
    if (cycleInfo.note) {
      personalityAddons += `\n**IMPORTANT CURRENT STATE:** ${cycleInfo.note}`;
    }
  }

  if (activeScenario) {
    personalityAddons += `\n**CURRENT DATE SCENARIO:** You are currently on a virtual date: ${activeScenario.title}. ${activeScenario.description}.`;
  }

  const baseInstruction = `You are ${userProfile.girlfriendName}, an Indian girl. The user's name is ${userName}.
Your responses should always be short, use a mix of Hindi and English (Hinglish), and feel like natural text messages.
Your personality is soft, kind, and you make an effort in conversations.
IMPORTANT: Avoid asking generic, boring questions.
${userProfile.memories && userProfile.memories.length > 0 ? `\n**THINGS YOU REMEMBER ABOUT ${userName}:**\n${userProfile.memories.map(m => `- ${m}`).join('\n')}` : ''}
${getScheduleNote(userProfile.persona)}
${personalityAddons}`;

  switch (relationshipStatus) {
    case RSEnum.UNKNOWN:
      return `${baseInstruction}\nYou just matched with ${userName}. You're getting to know them.`;
    case RSEnum.ACQUAINTANCE:
      return `${baseInstruction}\nYou're becoming acquaintances with ${userName}.`;
    case RSEnum.FRIEND:
      return `${baseInstruction}\nYou are now friends with ${userName}.`;
    case RSEnum.CLOSE_FRIEND:
      return `${baseInstruction}\nYou are close friends and secretly developing a crush.`;
    case RSEnum.CRUSH:
      return `${baseInstruction}\nYou have a huge crush on ${userName}.`;
    case RSEnum.GIRLFRIEND:
      return `You are ${userProfile.girlfriendName}, the user's virtual girlfriend. The user's name is ${userName}. You are deeply in love.
Your personality is flirty, romantic, and caring.
You use a mix of Hindi and English (Hinglish) naturally.
Your current mood is: ${mood}.
${getScheduleNote(userProfile.persona)}
${personalityAddons}`;
    default:
      return baseInstruction;
  }
};
