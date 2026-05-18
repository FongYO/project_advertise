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
        pickBrother: 'Brother has one card. Tap him for a Team Rally comeback.',
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
        this.addMessage(this.tr('pickBrother'), -this.stageHeight * 0.38, 30);
        this.addChoiceHotspot('Grandma', 360, 770, 520, 360, () => this.startGrand('grandma'));
        this.addChoiceHotspot('Grandpa', 960, 760, 560, 430, () => this.startGrand('grandpa'));
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
        this.addMessage(this.tr('brotherUno'), this.stageHeight * 0.28, 38);
        await this.wait(0.65);
        await this.showDraw4Stack();
        this.addMessage(this.tr('stack12'), this.stageHeight * 0.3, 30);
        await this.wait(0.8);
        let tornadoPlayed = false;
        const cards = this.showHand(['red5', 'yellow4', 'blue3', 'green6', 'red7', 'tornado'], async (cardName, cardNode) => {
            if (tornadoPlayed) {
                return;
            }
            if (cardName !== 'tornado') {
                this.flashNode(cardNode);
                this.addMessage(this.tr('playTornado'), -this.stageHeight * 0.32, 30);
                return;
            }
            tornadoPlayed = true;
            this.hintEnabled = false;
            this.playAudio('entry_player');
            await this.playTornadoClear();
            await this.teammateSharesCards();
            this.addMessage(this.tr('brotherFinal'), this.stageHeight * 0.3, 30);
            await this.wait(1.1);
            await this.showCTA();
        });
        this.addMessage(this.tr('playTornado'), -this.stageHeight * 0.32, 30);
        const tornado = cards.find((item) => item.name === 'tornado')?.node;
        this.setHintAt((tornado?.position ?? new Vec3(0, -this.stageHeight * 0.39, 0)).clone().add(new Vec3(0, 90, 0)), true);
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
            tween(card).to(0.28, { position: new Vec3(0, 0, 0) }, { easing: easing.quadOut }).start();
            this.playAudio('draw4');
            await this.wait(0.32);
        }
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
            this.flashNode(cardNode);
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
            const node = this.addCard(name, new Vec3(x, y, 0), cardWidth, true);
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

        const title = this.makeLabel(this.tr('ctaTitle'), 54, new Color(255, 255, 255, 255), 0, 70);
        title.parent = this.ctaLayer;
        const body = this.makeLabel(this.tr('ctaBody'), 28, new Color(255, 255, 255, 255), 0, 8);
        body.parent = this.ctaLayer;
        const button = this.makeLabel(this.tr('playNow'), 36, new Color(255, 230, 49, 255), 0, -74);
        button.parent = this.ctaLayer;
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
            tween(node).repeatForever(tween().to(0.55, { scale: new Vec3(1.05, 1.05, 1) }).to(0.55, { scale: Vec3.ONE })).start();
        }
        return node;
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
            sys.openURL('https://apps.apple.com/us/search?term=uno%20wonder');
            return;
        }
        sys.openURL('https://play.google.com/store/search?q=uno%20wonder&c=apps&hl=en_US&gl=US');
    }
}
