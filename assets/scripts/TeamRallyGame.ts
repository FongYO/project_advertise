import {
    _decorator,
    AudioClip,
    AudioSource,
    Button,
    Color,
    Component,
    easing,
    Label,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    sys,
    tween,
    Tween,
    UITransform,
    UIOpacity,
    Vec3,
    view,
} from 'cc';

const { ccclass } = _decorator;

type Teammate = 'brother' | 'grandma' | 'grandpa';
type FitMode = 'contain' | 'cover';

interface LoadedSprite {
    frame: SpriteFrame;
    width: number;
    height: number;
}

interface ImageRect {
    width: number;
    height: number;
    scale: number;
}

const DESIGN_CHOICE = { width: 1920, height: 1080 };
const DESIGN_BOARD = { width: 1080, height: 1920 };

const COPY = {
    en: {
        pickBrother: 'DRAW 4 ON...',
        pickGrand: 'Grandma and Grandpa share the same rally path.',
        brotherUno: 'Brother calls UNO!',
        stack12: '+4 stack! Team Rally splits +12 between you and Brother.',
        playTornado: 'Play Tornado to clear every card.',
        tornadoClear: 'Tornado clears your hand!',
        teammateShare: 'Brother shares 3 cards with you.',
        brotherFinal: 'Brother plays Tornado and calls UNO. Your turn is next!',
        grandStart: '{name} opens with Tornado and empties their hand.',
        giveCards: 'Choose 3 cards to rally your teammate.',
        giveHint: 'Give +4, Tornado, and one number card.',
        plus2: 'Counter the +2 stack.',
        opponentsDraw: 'Both rivals draw 2 cards.',
        grandDraw4: '{name} drops +4. Both rivals draw again.',
        playSkipAll: 'Play Skip All.',
        playWildAll: 'Play Wild All to finish the rally.',
        ctaTitle: 'UNO Wonder',
        ctaBody: 'Team Rally is ready. Play now!',
        playNow: 'PLAY NOW',
        legal: '©2026 Mattel',
    },
    fr: {
        pickBrother: 'Brother a une seule carte. Touchez-le pour le retour Team Rally.',
        pickGrand: 'Grandma et Grandpa suivent le même rally.',
        brotherUno: 'Brother annonce UNO !',
        stack12: 'Pile de +4 ! Team Rally partage +12 entre vous deux.',
        playTornado: 'Jouez Tornado pour vider votre main.',
        tornadoClear: 'Tornado vide votre main !',
        teammateShare: 'Brother vous donne 3 cartes.',
        brotherFinal: 'Brother joue Tornado et annonce UNO. A vous !',
        grandStart: '{name} commence avec Tornado et vide sa main.',
        giveCards: 'Choisissez 3 cartes pour aider votre coequipier.',
        giveHint: 'Donnez +4, Tornado et une carte chiffre.',
        plus2: 'Contrez la pile de +2.',
        opponentsDraw: 'Les deux rivaux piochent 2 cartes.',
        grandDraw4: '{name} joue +4. Les deux rivaux piochent encore.',
        playSkipAll: 'Jouez Skip All.',
        playWildAll: 'Jouez Wild All pour terminer.',
        ctaTitle: 'UNO Wonder',
        ctaBody: 'Team Rally vous attend. Jouez !',
        playNow: 'JOUER',
        legal: '©2026 Mattel',
    },
    de: {
        pickBrother: 'Brother hat nur eine Karte. Tippe ihn fuer das Team Rally Comeback.',
        pickGrand: 'Grandma und Grandpa haben denselben Rally Ablauf.',
        brotherUno: 'Brother ruft UNO!',
        stack12: '+4 Stapel! Team Rally teilt +12 zwischen euch auf.',
        playTornado: 'Spiele Tornado und leere deine Hand.',
        tornadoClear: 'Tornado leert deine Hand!',
        teammateShare: 'Brother gibt dir 3 Karten.',
        brotherFinal: 'Brother spielt Tornado und ruft UNO. Du bist dran!',
        grandStart: '{name} startet mit Tornado und leert die Hand.',
        giveCards: 'Waehle 3 Karten fuer dein Teammitglied.',
        giveHint: 'Gib +4, Tornado und eine Zahlenkarte.',
        plus2: 'Kontere den +2 Stapel.',
        opponentsDraw: 'Beide Gegner ziehen 2 Karten.',
        grandDraw4: '{name} spielt +4. Beide Gegner ziehen erneut.',
        playSkipAll: 'Spiele Skip All.',
        playWildAll: 'Spiele Wild All fuer den Abschluss.',
        ctaTitle: 'UNO Wonder',
        ctaBody: 'Team Rally ist bereit. Jetzt spielen!',
        playNow: 'SPIELEN',
        legal: '©2026 Mattel',
    },
    es: {
        pickBrother: 'Brother tiene una carta. Tocalo para remontar en Team Rally.',
        pickGrand: 'Grandma y Grandpa tienen la misma partida rally.',
        brotherUno: 'Brother grita UNO!',
        stack12: 'Pila de +4. Team Rally reparte +12 entre los dos.',
        playTornado: 'Juega Tornado para vaciar tu mano.',
        tornadoClear: 'Tornado limpia tu mano!',
        teammateShare: 'Brother te pasa 3 cartas.',
        brotherFinal: 'Brother juega Tornado y grita UNO. Te toca!',
        grandStart: '{name} abre con Tornado y vacia su mano.',
        giveCards: 'Elige 3 cartas para tu companero.',
        giveHint: 'Da +4, Tornado y una carta numerica.',
        plus2: 'Contraataca la pila de +2.',
        opponentsDraw: 'Los dos rivales roban 2 cartas.',
        grandDraw4: '{name} juega +4. Los rivales roban otra vez.',
        playSkipAll: 'Juega Skip All.',
        playWildAll: 'Juega Wild All para cerrar.',
        ctaTitle: 'UNO Wonder',
        ctaBody: 'Team Rally esta listo. Juega ahora!',
        playNow: 'JUGAR',
        legal: '©2026 Mattel',
    },
};

@ccclass('TeamRallyGame')
export class TeamRallyGame extends Component {
    private backgroundLayer!: Node;
    private gameLayer!: Node;
    private uiLayer!: Node;
    private hintLayer!: Node;
    private ctaLayer!: Node;
    private audio!: AudioSource;
    private stageWidth = 960;
    private stageHeight = 640;
    private activeRect: ImageRect = { width: 960, height: 640, scale: 1 };
    private activeDesign = DESIGN_CHOICE;
    private handHint?: Node;
    private hintTarget = new Vec3();
    private idleSeconds = 0;
    private hintEnabled = false;
    private hintRequestId = 0;
    private flowLocked = false;
    private currentLang: keyof typeof COPY = 'en';
    private selectedGiveCards = new Set<Node>();
    private selectedGiveCardNames = new Set<string>();
    private cached = new Map<string, LoadedSprite>();
    private opponentNode?: Node;
    private opponentFan: Node[] = [];
    private playerHandNodes: Node[] = [];
    private sequenceTimer?: number;

    onLoad() {
        this.currentLang = this.detectLanguage();
        this.audio = this.node.addComponent(AudioSource);
        this.createLayers();
        this.resize();
        view.on('canvas-resize', this.resize, this);
        this.node.on(Node.EventType.TOUCH_START, this.resetIdle, this);
    }

    start() {
        this.showChoose().catch((error) => {
            console.error('[TeamRallyGame] failed to start', error);
        });
    }

    update(dt: number) {
        if (!this.hintEnabled || !this.handHint) {
            return;
        }
        this.idleSeconds += dt;
        this.handHint.active = this.idleSeconds >= 2;
    }

    onDestroy() {
        view.off('canvas-resize', this.resize, this);
        this.node.off(Node.EventType.TOUCH_START, this.resetIdle, this);
        if (this.sequenceTimer !== undefined) {
            clearInterval(this.sequenceTimer);
        }
    }

    private createLayers() {
        this.backgroundLayer = this.makeLayer('Background');
        this.gameLayer = this.makeLayer('Game');
        this.hintLayer = this.makeLayer('Hint');
        this.uiLayer = this.makeLayer('UI');
        this.ctaLayer = this.makeLayer('CTA');
    }

    private makeLayer(name: string) {
        const layer = new Node(name);
        layer.parent = this.node;
        layer.addComponent(UITransform);
        return layer;
    }

    private resize() {
        const ui = this.node.getComponent(UITransform);
        if (ui) {
            this.stageWidth = ui.contentSize.width;
            this.stageHeight = ui.contentSize.height;
        }

        for (const layer of [this.backgroundLayer, this.gameLayer, this.uiLayer, this.hintLayer, this.ctaLayer]) {
            const transform = layer.getComponent(UITransform)!;
            transform.setContentSize(this.stageWidth, this.stageHeight);
        }
    }

    private async showChoose() {
        this.stopSequence();
        this.clearAll();
        this.flowLocked = false;
        this.activeDesign = DESIGN_CHOICE;
        await this.setBackground('teamrally/screens/choose_teammate', DESIGN_CHOICE, 'contain');
        await this.addLogo();
        this.addLegal();
        this.addMessage(this.tr('pickBrother'), this.stageHeight * 0.36, 42);
        this.addChoiceHotspot('Grandma', 360, 770, 520, 360, () => this.startBrother());
        this.addChoiceHotspot('Grandpa', 960, 760, 560, 430, () => this.startBrother());
        this.addChoiceHotspot('Brother', 1580, 760, 440, 360, () => this.startBrother());
        this.setHintAt(this.fromDesign(1580, 845), true);
    }

    private async startBrother() {
        if (this.flowLocked) {
            return;
        }
        this.flowLocked = true;
        this.playAudio('button_addfriend');
        this.hintEnabled = false;
        await this.showBoard();
        await this.addBrotherTargetBoard();
        this.addMessage('Play +4 on Brother!', -this.stageHeight * 0.32, 30);
        let draw4Played = false;
        const cards = this.showHand(['green6', 'yellow4', 'blue3', 'red5', 'blue_plus2', 'draw4', 'green6'], async (cardName, cardNode) => {
            if (draw4Played) {
                return;
            }
            if (cardName !== 'draw4') {
                this.shakeNode(cardNode);
                this.addMessage('Use the +4 card!', -this.stageHeight * 0.32, 30);
                return;
            }
            draw4Played = true;
            this.hintEnabled = false;
            this.playAudio('entry_player');
            await this.playDraw4Attack(cardNode);
            await this.showCTA();
        });
        this.playerHandNodes = cards.map((item) => item.node);
        const draw4 = cards.find((item) => item.name === 'draw4')?.node;
        if (draw4) {
            this.setHintAt(draw4.position.clone().add(new Vec3(0, 90, 0)), true);
        }
    }

    private async addBrotherTargetBoard() {
        const opponent = await this.addSprite('teamrally/avatars/brother_face', this.gameLayer, {
            name: 'BrotherFace',
            x: this.stageWidth * 0.34,
            y: this.stageHeight * 0.14,
            width: 130,
        });
        opponent.scale = new Vec3(0.25, 0.25, 1);
        this.opponentNode = opponent;
        tween(opponent)
            .to(0.34, { scale: Vec3.ONE }, { easing: easing.backOut })
            .call(() => {
                tween(opponent).repeatForever(tween().by(0.7, { position: new Vec3(0, 8, 0) }).by(0.7, { position: new Vec3(0, -8, 0) })).start();
            })
            .start();

        const name = this.makeLabel('Brother', 24, new Color(255, 255, 255, 255), this.stageWidth * 0.34, this.stageHeight * 0.02);
        name.parent = this.gameLayer;

        this.addOpponentFan(new Vec3(this.stageWidth * 0.18, this.stageHeight * 0.2, 0), 11, 58);
        this.addDeckPile(new Vec3(-this.stageWidth * 0.32, this.stageHeight * 0.04, 0));
    }

    private addOpponentFan(center: Vec3, count: number, width: number) {
        this.opponentFan = [];
        for (let i = 0; i < count; i++) {
            const t = count <= 1 ? 0 : i / (count - 1);
            const angle = -36 + t * 72;
            const x = center.x + (t - 0.5) * 150;
            const y = center.y - Math.abs(t - 0.5) * 44;
            const card = this.addCard('back', new Vec3(x, y - 110, 0), width, false);
            card.angle = angle;
            card.scale = new Vec3(0.2, 0.2, 1);
            this.opponentFan.push(card);
            tween(card)
                .delay(i * 0.035)
                .to(0.26, { position: new Vec3(x, y, 0), scale: Vec3.ONE }, { easing: easing.backOut })
                .start();
        }
    }

    private addDeckPile(position: Vec3) {
        for (let i = 0; i < 3; i++) {
            const card = this.addCard('back', position.clone().add(new Vec3(i * 5, i * 4, 0)), 70, false);
            card.angle = -18;
        }
    }

    private async playDraw4Attack(cardNode: Node) {
        this.hintRequestId++;
        this.clearNode(this.hintLayer);
        this.handHint = undefined;
        this.playerHandNodes = this.playerHandNodes.filter((node) => node !== cardNode && node.isValid);
        this.layoutPlayerHand();
        this.addMessage('Give Brother +4!', this.stageHeight * 0.3, 38);
        await this.flyCardToTarget(cardNode, new Vec3(this.stageWidth * 0.23, this.stageHeight * 0.18, 0), 1.1, '+4');
        if (cardNode.isValid) {
            cardNode.destroy();
        }
        await this.dealCardsToBrother(4);
        if (this.opponentNode) {
            this.shakeNode(this.opponentNode, false);
        }
        this.addMessage('Brother starts a combo!', this.stageHeight * 0.3, 34);
        await this.wait(0.45);
        await this.playBrotherCombo();
        await this.playBrotherFinalCard();
        await this.wait(0.75);
    }

    private async dealCardsToBrother(count: number) {
        const deck = new Vec3(-this.stageWidth * 0.32, this.stageHeight * 0.04, 0);
        const target = new Vec3(this.stageWidth * 0.24, this.stageHeight * 0.18, 0);
        for (let i = 0; i < count; i++) {
            const card = this.addCard('back', deck.clone(), 58, false);
            card.angle = -18;
            tween(card)
                .to(0.34, {
                    position: target.clone().add(new Vec3(i * 16, -i * 4, 0)),
                    scale: new Vec3(0.92, 0.92, 1),
                }, { easing: easing.quadOut })
                .call(() => {
                    card.angle = 18 + i * 8;
                    this.opponentFan.push(card);
                })
                .start();
            this.playAudio('draw4');
            await this.wait(0.13);
        }
        this.layoutOpponentFan();
        await this.wait(0.38);
    }

    private async playBrotherCombo() {
        const combo = [
            { card: 'blue_plus2', label: '+2', draw: 2 },
            { card: 'draw4', label: '+4', draw: 4 },
            { card: 'green_plus2', label: '+2', draw: 2 },
            { card: 'draw4', label: '+4', draw: 4 },
            { card: 'blue_plus2', label: '+2', draw: 2 },
        ];
        for (const step of combo) {
            await this.playBrotherAction(step.card, step.label, step.draw);
        }
    }

    private async playBrotherAction(cardName: string, label: string, drawCount: number) {
        const card = this.takeOpponentCard();
        await this.setCardFace(card, cardName);
        this.addMessage(`Brother plays ${label}!`, this.stageHeight * 0.3, 34);
        await this.flyCardToTarget(card, new Vec3(this.stageWidth * 0.03, this.stageHeight * 0.05, 0), 1.08, label);
        await this.playFxSequence(label === '+4' ? 'flash' : 'energy', new Vec3(this.stageWidth * 0.05, this.stageHeight * 0.04, 0), 0.035, 0.65);
        if (card.isValid) {
            card.destroy();
        }
        await this.dealCardsToPlayer(drawCount);
        this.layoutOpponentFan();
        await this.wait(0.16);
    }

    private async dealCardsToPlayer(count: number) {
        const deck = new Vec3(-this.stageWidth * 0.32, this.stageHeight * 0.04, 0);
        const faces = ['green6', 'yellow8', 'blue3', 'red7', 'yellow4', 'red5', 'blue_plus2', 'green_plus2', 'draw4', 'wild'];
        for (let i = 0; i < count; i++) {
            const card = this.addCard(faces[(this.playerHandNodes.length + i) % faces.length], deck.clone(), this.playerCardWidth(), false);
            card.angle = -18;
            card.scale = new Vec3(0.82, 0.82, 1);
            this.playerHandNodes.push(card);
            this.layoutPlayerHand();
            this.playAudio('draw4');
            await this.wait(0.09);
        }
        this.popText(`Your hand +${count}`, new Vec3(0, -this.stageHeight * 0.18, 0), 36, new Color(255, 230, 49, 255));
        await this.wait(0.2);
    }

    private async playBrotherFinalCard() {
        const finalCard = this.takeOpponentCard();
        await this.setCardFace(finalCard, 'tornado');
        this.addMessage('Brother plays Tornado!', this.stageHeight * 0.3, 36);
        await this.wait(0.35);
        await this.flyCardToTarget(finalCard, new Vec3(0, 0, 0), 1.28, 'BOOM!');
        await this.playFxSequence('energy', new Vec3(0, 0, 0), 0.04, 1.25);
        await this.clearOpponentHandWithTornado();
        if (finalCard.isValid) {
            finalCard.destroy();
        }
        this.addMessage('BOOM, You lose!', this.stageHeight * 0.3, 40);
    }

    private async clearOpponentHandWithTornado() {
        const active = this.opponentFan.filter((node) => node.isValid);
        this.opponentFan = [];
        for (let i = 0; i < active.length; i++) {
            const card = active[i];
            Tween.stopAllByTarget(card);
            card.parent = this.hintLayer;
            card.angle = 0;
            tween(card)
                .delay(i * 0.025)
                .to(0.22, { position: new Vec3(0, 0, 0), scale: new Vec3(0.08, 0.08, 1) }, { easing: easing.quadIn })
                .call(() => card.destroy())
                .start();
        }
        this.popText('Tornado clears Brother!', new Vec3(0, this.stageHeight * 0.18, 0), 34, new Color(255, 230, 49, 255));
        await this.wait(0.48);
    }

    private takeOpponentCard() {
        while (this.opponentFan.length > 0) {
            const card = this.opponentFan.pop();
            if (card?.isValid) {
                Tween.stopAllByTarget(card);
                card.parent = this.hintLayer;
                card.angle = 0;
                return card;
            }
        }
        return this.addCard('back', new Vec3(this.stageWidth * 0.22, this.stageHeight * 0.18, 0), 58, false);
    }

    private layoutOpponentFan() {
        const active = this.opponentFan.filter((node) => node.isValid);
        this.opponentFan = active;
        const center = new Vec3(this.stageWidth * 0.18, this.stageHeight * 0.2, 0);
        const count = active.length;
        active.forEach((card, index) => {
            const t = count <= 1 ? 0.5 : index / (count - 1);
            const angle = -42 + t * 84;
            const x = center.x + (t - 0.5) * Math.min(210, 14 * count);
            const y = center.y - Math.abs(t - 0.5) * 48;
            card.angle = angle;
            tween(card).to(0.18, { position: new Vec3(x, y, 0), scale: Vec3.ONE }, { easing: easing.quadOut }).start();
        });
    }

    private layoutPlayerHand() {
        const active = this.playerHandNodes.filter((node) => node.isValid);
        this.playerHandNodes = active;
        const count = active.length;
        const width = this.playerCardWidth();
        const maxSpread = Math.min(this.stageWidth * 0.9, 760);
        const spacing = count <= 1 ? 0 : Math.min(width * 0.52, maxSpread / (count - 1));
        const y = -this.stageHeight * 0.38;
        active.forEach((card, index) => {
            const x = (index - (count - 1) / 2) * spacing;
            const transform = card.getComponent(UITransform);
            if (transform) {
                transform.setContentSize(width, width * 1.42);
            }
            card.angle = (index - (count - 1) / 2) * 1.4;
            tween(card).to(0.22, { position: new Vec3(x, y, 0), scale: Vec3.ONE }, { easing: easing.quadOut }).start();
        });
    }

    private playerCardWidth() {
        return Math.min(92, Math.max(70, this.stageWidth * 0.105));
    }

    private async startGrand(teammate: Teammate) {
        if (this.flowLocked) {
            return;
        }
        this.flowLocked = true;
        this.playAudio('button_addfriend');
        this.hintEnabled = false;
        await this.showBoard();
        const name = teammate === 'grandpa' ? 'Grandpa' : 'Grandma';
        this.addMessage(this.tr('grandStart').replace('{name}', name), this.stageHeight * 0.3, 30);
        await this.playFxSequence('energy', new Vec3(0, this.stageHeight * 0.1, 0), 0.04, 1.2);
        await this.wait(0.55);
        this.addMessage(this.tr('giveCards'), this.stageHeight * 0.3, 30);
        const cards = this.showHand(['draw4', 'skip_all', 'tornado', 'wild_all', 'blue_plus2', 'red5', 'yellow8'], (cardName, cardNode) => {
            this.handleGiveSelection(cardName, cardNode, name);
        });
        const firstTarget = cards.find((item) => item.name === 'draw4')?.node;
        if (firstTarget) {
            this.setHintAt(firstTarget.position.clone().add(new Vec3(0, 90, 0)), true);
        }
    }

    private async continueGrandAfterGive(name: string) {
        this.hintEnabled = false;
        this.addMessage(this.tr('plus2'), this.stageHeight * 0.3, 30);
        const plus2 = this.addCard('blue_plus2', new Vec3(0, -this.stageHeight * 0.32, 0), 116, true);
        this.setHintAt(plus2.position.clone().add(new Vec3(0, 90, 0)), true);
        let plus2Played = false;
        this.bindTap(plus2, async () => {
            if (plus2Played) {
                return;
            }
            plus2Played = true;
            this.hintEnabled = false;
            plus2.destroy();
            this.addCard('blue_plus2', new Vec3(0, 0, 0), 120, false);
            this.playAudio('draw4');
            await this.playFxSequence('flash', new Vec3(0, 20, 0), 0.035, 1.05);
            this.addMessage(this.tr('opponentsDraw'), this.stageHeight * 0.3, 30);
            await this.wait(0.8);
            this.addMessage(this.tr('grandDraw4').replace('{name}', name), this.stageHeight * 0.3, 30);
            this.addCard('draw4', new Vec3(0, this.stageHeight * 0.16, 0), 120, false);
            await this.playFxSequence('energy', new Vec3(0, this.stageHeight * 0.1, 0), 0.04, 1);
            await this.wait(0.5);
            await this.playRequiredCard('skip_all', this.tr('playSkipAll'));
            await this.playRequiredCard('wild_all', this.tr('playWildAll'));
            await this.showCTA();
        });
    }

    private async showBoard() {
        this.stopSequence();
        this.clearAll();
        this.activeDesign = DESIGN_BOARD;
        await this.setBackground('teamrally/screens/board_vertical', DESIGN_BOARD, 'cover');
        await this.addLogo();
        this.addLegal();
    }

    private async showDraw4Stack() {
        const positions = [
            new Vec3(this.stageWidth * 0.26, this.stageHeight * 0.06, 0),
            new Vec3(0, -this.stageHeight * 0.18, 0),
            new Vec3(-this.stageWidth * 0.26, this.stageHeight * 0.06, 0),
        ];
        for (const pos of positions) {
            const card = this.addCard('draw4', pos, 105, false);
            card.scale = new Vec3(0.3, 0.3, 1);
            tween(card)
                .to(0.2, { scale: new Vec3(1.15, 1.15, 1) }, { easing: easing.backOut })
                .to(0.34, { position: new Vec3(0, 0, 0), scale: Vec3.ONE }, { easing: easing.quadOut })
                .start();
            this.popText('+4', pos.clone().add(new Vec3(44, 62, 0)), 44, new Color(72, 181, 255, 255));
            this.playAudio('draw4');
            await this.wait(0.32);
        }
        this.popText('+12', new Vec3(0, this.stageHeight * 0.18, 0), 54, new Color(255, 230, 49, 255));
    }

    private async playTornadoClear() {
        this.addMessage(this.tr('tornadoClear'), this.stageHeight * 0.3, 34);
        await this.playFxSequence('energy', new Vec3(0, -20, 0), 0.045, 1.25);
        for (const child of [...this.gameLayer.children]) {
            if (child.name.startsWith('HandCard')) {
                tween(child).to(0.35, { scale: new Vec3(0.2, 0.2, 1), position: new Vec3(0, 0, 0) }).call(() => child.destroy()).start();
            }
        }
        await this.wait(0.45);
    }

    private async teammateSharesCards() {
        this.addMessage(this.tr('teammateShare'), this.stageHeight * 0.3, 30);
        const hand = ['red7', 'yellow4', 'wild_all'];
        const spacing = Math.min(110, this.stageWidth / 6);
        for (let i = 0; i < hand.length; i++) {
            const card = this.addCard(hand[i], new Vec3(0, this.stageHeight * 0.22, 0), 108, false);
            tween(card).to(0.38, { position: new Vec3((i - 1) * spacing, -this.stageHeight * 0.34, 0) }, { easing: easing.backOut }).start();
            await this.wait(0.18);
        }
        await this.wait(0.55);
    }

    private handleGiveSelection(cardName: string, cardNode: Node, teammateName: string) {
        const required = new Set(['draw4', 'tornado', 'red5']);
        if (!required.has(cardName)) {
            this.shakeNode(cardNode);
            this.addMessage(this.tr('giveHint'), -this.stageHeight * 0.32, 28);
            return;
        }
        if (this.selectedGiveCards.has(cardNode)) {
            return;
        }
        this.playAudio('button_addfriend');
        this.selectedGiveCards.add(cardNode);
        this.selectedGiveCardNames.add(cardName);
        tween(cardNode).to(0.12, { scale: new Vec3(cardNode.scale.x * 1.12, cardNode.scale.y * 1.12, 1) }).start();
        if (this.selectedGiveCards.size >= 3) {
            for (const node of this.selectedGiveCards) {
                tween(node).to(0.42, { position: new Vec3(0, this.stageHeight * 0.22, 0), scale: new Vec3(0.2, 0.2, 1) }, { easing: easing.quadIn }).call(() => node.destroy()).start();
            }
            for (const child of [...this.gameLayer.children]) {
                if (child.name.startsWith('HandCard') && !this.selectedGiveCards.has(child)) {
                    tween(child).to(0.25, { scale: new Vec3(0.2, 0.2, 1) }).call(() => child.destroy()).start();
                }
            }
            this.selectedGiveCards.clear();
            this.selectedGiveCardNames.clear();
            this.wait(0.55).then(() => this.continueGrandAfterGive(teammateName));
        } else {
            const nextName = [...required].find((name) => !this.selectedGiveCardNames.has(name));
            const nextCard = nextName
                ? [...this.gameLayer.children].find((child) => child.name === `HandCard_${nextName}`)
                : undefined;
            if (nextCard) {
                this.setHintAt(nextCard.position.clone().add(new Vec3(0, 90, 0)), true);
            }
        }
    }

    private async playRequiredCard(cardName: string, prompt: string) {
        this.addMessage(prompt, this.stageHeight * 0.3, 30);
        const card = this.addCard(cardName, new Vec3(0, -this.stageHeight * 0.32, 0), 116, true);
        this.setHintAt(card.position.clone().add(new Vec3(0, 90, 0)), true);
        await new Promise<void>((resolve) => {
            let resolved = false;
            this.bindTap(card, async () => {
                if (resolved) {
                    return;
                }
                resolved = true;
                this.hintEnabled = false;
                this.playAudio('entry_player');
                tween(card).to(0.3, { position: new Vec3(0, 0, 0), scale: new Vec3(0.3, 0.3, 1) }).call(() => card.destroy()).start();
                await this.playFxSequence('flash', new Vec3(0, 0, 0), 0.035, 0.95);
                resolve();
            });
        });
    }

    private showHand(cardNames: string[], onTap: (cardName: string, cardNode: Node) => void) {
        const cardWidth = Math.min(92, Math.max(62, this.stageWidth / (cardNames.length + 1.6)));
        const spacing = Math.min(cardWidth * 0.78, this.stageWidth / (cardNames.length + 1));
        const y = -this.stageHeight * 0.39;
        return cardNames.map((name, index) => {
            const x = (index - (cardNames.length - 1) / 2) * spacing;
            const node = this.addCard(name, new Vec3(x, y, 0), cardWidth, false);
            node.scale = new Vec3(0.65, 0.65, 1);
            const opacity = node.addComponent(UIOpacity);
            opacity.opacity = 0;
            tween(opacity).delay(index * 0.05).to(0.16, { opacity: 255 }).start();
            tween(node)
                .delay(index * 0.05)
                .to(0.26, { scale: new Vec3(1.08, 1.08, 1) }, { easing: easing.backOut })
                .to(0.12, { scale: Vec3.ONE })
                .call(() => this.startCardPulse(node))
                .start();
            this.bindTap(node, () => onTap(name, node));
            return { name, node };
        });
    }

    private addChoiceHotspot(label: string, x: number, y: number, width: number, height: number, cb: () => void) {
        const node = new Node(`Choice_${label}`);
        node.parent = this.uiLayer;
        node.position = this.fromDesign(x, y);
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width * this.activeRect.scale, height * this.activeRect.scale);
        node.on(Node.EventType.TOUCH_END, cb, this);
    }

    private addMessage(text: string, y: number, fontSize: number) {
        let node = this.uiLayer.getChildByName('Message');
        if (!node) {
            node = new Node('Message');
            node.parent = this.uiLayer;
            const transform = node.addComponent(UITransform);
            transform.setContentSize(Math.min(760, this.stageWidth * 0.88), 92);
            const label = node.addComponent(Label);
            label.color = new Color(255, 255, 255, 255);
            label.enableOutline = true;
            label.outlineWidth = 5;
            label.outlineColor = new Color(18, 77, 151, 255);
            label.horizontalAlign = Label.HorizontalAlign.CENTER;
            label.verticalAlign = Label.VerticalAlign.CENTER;
            label.overflow = Label.Overflow.SHRINK;
        }
        node.position = new Vec3(0, y, 0);
        const label = node.getComponent(Label)!;
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
    }

    private async addLogo() {
        await this.addSprite('teamrally/logos/UNOWonder-LOGO-Final', this.uiLayer, {
            name: 'Logo',
            x: -this.stageWidth * 0.5 + 120,
            y: this.stageHeight * 0.5 - 72,
            width: 190,
        });
    }

    private addLegal() {
        const node = new Node('LegalLine');
        node.parent = this.uiLayer;
        node.position = new Vec3(0, -this.stageHeight * 0.5 + 22, 0);
        node.addComponent(UITransform).setContentSize(this.stageWidth * 0.9, 32);
        const label = node.addComponent(Label);
        label.string = this.tr('legal');
        label.fontSize = 18;
        label.lineHeight = 20;
        label.color = new Color(255, 255, 255, 235);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.enableOutline = true;
        label.outlineWidth = 2;
        label.outlineColor = new Color(0, 0, 0, 180);
    }

    private async showCTA() {
        this.hintEnabled = false;
        this.clearNode(this.ctaLayer);
        const shade = await this.addSprite('teamrally/screens/card_effects', this.ctaLayer, {
            name: 'CTABg',
            x: 0,
            y: 0,
            height: this.stageHeight,
        });
        const opacity = shade.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.25, { opacity: 255 }).start();

        const title = this.makeLabel('BOOM, You lose!', 46, new Color(255, 255, 255, 255), 0, 84);
        title.parent = this.ctaLayer;
        const body = this.makeLabel('Try the +4 comeback in UNO Mobile.', 26, new Color(255, 255, 255, 255), 0, 18);
        body.parent = this.ctaLayer;
        const button = this.makeLabel(this.tr('playNow'), 38, new Color(255, 230, 49, 255), 0, -78);
        button.parent = this.ctaLayer;
        tween(button).repeatForever(tween().to(0.45, { scale: new Vec3(1.08, 1.08, 1) }).to(0.45, { scale: Vec3.ONE })).start();
        this.bindTap(button, () => {
            this.openStore();
        });
        this.addLegal();
    }

    private async setBackground(path: string, design: { width: number; height: number }, mode: FitMode) {
        this.clearNode(this.backgroundLayer);
        const loaded = await this.loadSprite(path);
        const node = new Node('SceneBackground');
        node.parent = this.backgroundLayer;
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = loaded.frame;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        const fitScale = mode === 'cover'
            ? Math.max(this.stageWidth / loaded.width, this.stageHeight / loaded.height)
            : Math.min(this.stageWidth / loaded.width, this.stageHeight / loaded.height);
        const width = loaded.width * fitScale;
        const height = loaded.height * fitScale;
        node.addComponent(UITransform).setContentSize(width, height);
        this.activeRect = { width, height, scale: width / design.width };
        this.activeDesign = design;
    }

    private async addSprite(path: string, parent: Node, opts: { name: string; x: number; y: number; width?: number; height?: number }) {
        const loaded = await this.loadSprite(path);
        const node = new Node(opts.name);
        node.parent = parent;
        node.position = new Vec3(opts.x, opts.y, 0);
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = loaded.frame;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        const ratio = loaded.height / loaded.width;
        const width = opts.width ?? (opts.height ? opts.height / ratio : loaded.width);
        const height = opts.height ?? width * ratio;
        node.addComponent(UITransform).setContentSize(width, height);
        return node;
    }

    private addCard(name: string, position: Vec3, width: number, interactive: boolean) {
        const node = new Node(`HandCard_${name}`);
        node.parent = this.gameLayer;
        node.position = position;
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        node.addComponent(UITransform).setContentSize(width, width * 1.42);
        this.loadSprite(`teamrally/cards_normalized/${name}`).then((loaded) => {
            sprite.spriteFrame = loaded.frame;
        });
        if (interactive) {
            this.startCardPulse(node);
        }
        return node;
    }

    private startCardPulse(node: Node) {
        if (!node.isValid) {
            return;
        }
        tween(node).repeatForever(tween().to(0.55, { scale: new Vec3(1.05, 1.05, 1) }).to(0.55, { scale: Vec3.ONE })).start();
    }

    private async playFxSequence(prefix: 'energy' | 'flash', position: Vec3, frameTime: number, scale: number) {
        this.stopSequence();
        const frames: LoadedSprite[] = [];
        for (let i = 0; i < 12; i++) {
            const frameIndex = i < 10 ? `0${i}` : `${i}`;
            frames.push(await this.loadSprite(`teamrally/fx/${prefix}_${frameIndex}`));
        }
        const node = new Node(`${prefix}_fx`);
        node.parent = this.hintLayer;
        node.position = position;
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        const transform = node.addComponent(UITransform);
        node.scale = new Vec3(scale, scale, 1);
        let index = 0;
        return new Promise<void>((resolve) => {
            this.sequenceTimer = window.setInterval(() => {
                const loaded = frames[index];
                sprite.spriteFrame = loaded.frame;
                transform.setContentSize(Math.min(this.stageWidth * 0.85, loaded.width), Math.min(this.stageHeight * 0.55, loaded.height));
                index++;
                if (index >= frames.length) {
                    this.stopSequence();
                    node.destroy();
                    resolve();
                }
            }, frameTime * 1000);
        });
    }

    private stopSequence() {
        if (this.sequenceTimer !== undefined) {
            clearInterval(this.sequenceTimer);
            this.sequenceTimer = undefined;
        }
    }

    private async loadSprite(path: string): Promise<LoadedSprite> {
        const cached = this.cached.get(path);
        if (cached) {
            return cached;
        }
        return new Promise((resolve, reject) => {
            resources.load(`${path}/spriteFrame`, SpriteFrame, (err, frame) => {
                if (err || !frame) {
                    reject(err);
                    return;
                }
                const rect = frame.rect;
                const loaded = { frame, width: rect.width, height: rect.height };
                this.cached.set(path, loaded);
                resolve(loaded);
            });
        });
    }

    private async setCardFace(node: Node, name: string) {
        const sprite = node.getComponent(Sprite);
        if (!sprite) {
            return;
        }
        const loaded = await this.loadSprite(`teamrally/cards_normalized/${name}`);
        sprite.spriteFrame = loaded.frame;
    }

    private bindTap(node: Node, cb: () => void) {
        if (!node.getComponent(Button)) {
            node.addComponent(Button);
        }
        node.on(Node.EventType.TOUCH_END, cb, this);
    }

    private setHintAt(position: Vec3, enabled: boolean) {
        this.hintTarget = position;
        this.hintEnabled = enabled;
        this.idleSeconds = 0;
        const hintLayout = this.getHintLayout(position);
        if (!this.handHint) {
            const requestId = ++this.hintRequestId;
            this.addSprite('teamrally/fx/hand_hint', this.hintLayer, {
                name: 'HandHint',
                x: hintLayout.position.x,
                y: hintLayout.position.y,
                width: hintLayout.width,
            }).then((node) => {
                if (requestId !== this.hintRequestId || !this.hintEnabled) {
                    node.destroy();
                    return;
                }
                this.handHint = node;
                this.applyHintLayout(node, this.hintTarget);
                node.active = false;
                tween(node).repeatForever(tween().by(0.55, { position: new Vec3(0, -18, 0) }).by(0.55, { position: new Vec3(0, 18, 0) })).start();
            });
        } else {
            this.applyHintLayout(this.handHint, this.hintTarget);
            this.handHint.active = false;
        }
    }

    private getHintLayout(position: Vec3) {
        const isLowerHint = position.y < -this.stageHeight * 0.16;
        const offsetX = isLowerHint ? 78 : 54;
        const offsetY = isLowerHint ? -148 : -84;
        return {
            position: new Vec3(position.x + offsetX, position.y + offsetY, 0),
            width: isLowerHint ? 112 : 138,
        };
    }

    private applyHintLayout(node: Node, target: Vec3) {
        const layout = this.getHintLayout(target);
        node.position = layout.position;
        const transform = node.getComponent(UITransform);
        if (!transform) {
            return;
        }
        const size = transform.contentSize;
        const ratio = size.width > 0 ? size.height / size.width : 1;
        transform.setContentSize(layout.width, layout.width * ratio);
    }

    private resetIdle() {
        this.idleSeconds = 0;
        if (this.handHint) {
            this.handHint.active = false;
        }
    }

    private flashNode(node: Node) {
        tween(node).to(0.08, { scale: new Vec3(1.18, 1.18, 1) }).to(0.12, { scale: Vec3.ONE }).start();
    }

    private shakeNode(node: Node, restartPulse = node.name.startsWith('HandCard')) {
        const origin = node.position.clone();
        Tween.stopAllByTarget(node);
        tween(node)
            .to(0.05, { position: origin.clone().add(new Vec3(-14, 0, 0)), scale: new Vec3(1.12, 1.12, 1) })
            .to(0.05, { position: origin.clone().add(new Vec3(14, 0, 0)) })
            .to(0.05, { position: origin.clone().add(new Vec3(-10, 0, 0)) })
            .to(0.08, { position: origin, scale: Vec3.ONE })
            .call(() => {
                if (restartPulse) {
                    this.startCardPulse(node);
                }
            })
            .start();
    }

    private flyCardToCenter(node: Node) {
        return this.flyCardToTarget(node, new Vec3(0, 0, 0), 1.35, 'BOOM!');
    }

    private flyCardToTarget(node: Node, target: Vec3, scale: number, effectText?: string) {
        Tween.stopAllByTarget(node);
        node.parent = this.hintLayer;
        return new Promise<void>((resolve) => {
            tween(node)
                .to(0.22, { scale: new Vec3(1.22, 1.22, 1) }, { easing: easing.backOut })
                .to(0.36, { position: target, scale: new Vec3(scale, scale, 1) }, { easing: easing.quadOut })
                .call(() => {
                    if (effectText) {
                        this.popText(effectText, target.clone().add(new Vec3(0, this.stageHeight * 0.16, 0)), 48, new Color(255, 230, 49, 255));
                    }
                    resolve();
                })
                .start();
        });
    }

    private popText(text: string, position: Vec3, fontSize: number, color: Color) {
        const node = this.makeLabel(text, fontSize, color, position.x, position.y);
        node.parent = this.hintLayer;
        node.scale = new Vec3(0.2, 0.2, 1);
        const opacity = node.addComponent(UIOpacity);
        opacity.opacity = 255;
        tween(node)
            .to(0.18, { scale: new Vec3(1.18, 1.18, 1) }, { easing: easing.backOut })
            .to(0.42, { position: position.clone().add(new Vec3(0, 56, 0)), scale: Vec3.ONE })
            .call(() => node.destroy())
            .start();
        tween(opacity).delay(0.28).to(0.32, { opacity: 0 }).start();
    }

    private makeLabel(text: string, fontSize: number, color: Color, x: number, y: number) {
        const node = new Node(text);
        node.position = new Vec3(x, y, 0);
        node.addComponent(UITransform).setContentSize(Math.min(760, this.stageWidth * 0.88), 72);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        label.enableOutline = true;
        label.outlineWidth = 5;
        label.outlineColor = new Color(18, 77, 151, 255);
        return node;
    }

    private fromDesign(x: number, y: number) {
        const stageX = (x - this.activeDesign.width / 2) * this.activeRect.scale;
        const stageY = (this.activeDesign.height / 2 - y) * this.activeRect.scale;
        return new Vec3(stageX, stageY, 0);
    }

    private wait(seconds: number) {
        return new Promise<void>((resolve) => {
            this.scheduleOnce(() => resolve(), seconds);
        });
    }

    private playAudio(name: string) {
        resources.load(`teamrally/audio/${name}`, AudioClip, (err, clip) => {
            if (!err && clip) {
                this.audio.playOneShot(clip, 0.8);
            }
        });
    }

    private tr(key: keyof typeof COPY.en) {
        return COPY[this.currentLang][key] ?? COPY.en[key];
    }

    private detectLanguage(): keyof typeof COPY {
        const language = (sys.languageCode || 'en').slice(0, 2).toLowerCase();
        if (language === 'fr' || language === 'de' || language === 'es') {
            return language;
        }
        return 'en';
    }

    private clearAll() {
        this.clearNode(this.backgroundLayer);
        this.clearNode(this.gameLayer);
        this.clearNode(this.uiLayer);
        this.clearNode(this.hintLayer);
        this.clearNode(this.ctaLayer);
        this.hintRequestId++;
        this.handHint = undefined;
        this.selectedGiveCards.clear();
        this.selectedGiveCardNames.clear();
    }

    private clearNode(node: Node) {
        for (const child of [...node.children]) {
            child.destroy();
        }
    }

    private openStore() {
        if (sys.os === sys.OS.IOS || sys.os === sys.OS.OSX) {
            sys.openURL('https://apps.apple.com/us/search?term=uno%20mobile');
            return;
        }
        sys.openURL('https://play.google.com/store/search?q=uno%20mobile&c=apps&hl=en_US&gl=US');
    }
}
