class DialogueButton {}

class DialogueButtonNext extends DialogueButton {}

class DialogueButtonQuest extends DialogueButton {}

export class Dialogue {
  static buttons = {
    common: DialogueButton,
  }
}
