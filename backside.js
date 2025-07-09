    <div class="migaku-card-screenshot">
        {{editable:Screenshot}}
    </div>

    <div class="migaku-card-content">
        <div class="migaku-card-sentence-audio">
            {{editable:Sentence Audio}}
        </div>
        <div class="migaku-card-sentence">
            <div class="field" data-popup="yes" data-gender-coloring="yes">{{editable:Sentence}}</div>
        </div>
        <div class="migaku-card-translation">
            {{editable:Translation}}
        </div>
        {{#Sentence}}
            <hr class="sentence-separator">
        {{/Sentence}}
        <div class="migaku-card-unknown-audio migaku-indented">
            {{editable:Word Audio}}
        </div>
        <div class="migaku-card-unknown migaku-indented">
            <div class="field" data-popup="yes" data-gender-coloring="yes" data-field-type="target-word">{{editable:Target Word}}</div>
        </div>

        <div class="migaku-card-examples migaku-indented">
            <div class="field" data-popup="yes" data-gender-coloring="yes">{{editable:Example Sentences}}</div>
        </div>
        <div class="migaku-card-definitions migaku-indented">
            <div class="field" data-popup="yes">{{editable:Definitions}}</div>
        </div>
        <div class="migaku-card-images">
            {{editable:Images}}
        </div>
    </div>
</div>


<div class="migaku-typeselect">
    <form>
        <label>
            <input type="radio" id="type-s" name="type" value="s">
            Sentence
        </label>

        <label>
            <input type="radio" id="type-v" name="type" value="v">
            Vocabulary
        </label>

        <label>
            <input type="radio" id="type-as" name="type" value="as">
            Audio Sentence
        </label>

        <label>
            <input type="radio" id="type-av" name="type" value="av">
            Audio Vocabulary
        </label>
    </form>
</div>

<script>
    if (typeof (pycmd) !== "undefined") {
        const form = document.querySelector('.migaku-typeselect form');

        let card_type = `{{Is Vocabulary Card}}`.replace(/(<([^>]+)>)/ig, '').length ? 'v' : 's';
        if (`{{Is Audio Card}}`.replace(/(<([^>]+)>)/ig, '').length) {
            card_type = 'a' + card_type;
        }
        form.elements["type"].value = card_type;

        form.onchange = function () {
            const card_type = form.elements['type'].value;
            pycmd('update_card_type|' + card_type);
        }
    }
    else {
        document.querySelector('.migaku-typeselect').style.display = 'none';
    }
</script>

<!--###MIGAKU GERMAN SUPPORT JS STARTS###--><script>

    (function () {

        const word_pos_names = {
            v: "Verb",
            adj: "Adjective",
            adv: "Adverb",
            art: "Article",
            cnum: "Cardinal Number",
            circ: "Zirkumposition",
            conj: "Conjunction",
            demo: "Demonstrative",
            ind: "Indefinite Pronoun",
            int: "Interjection",
            onum: "Ordinal Number",
            n: "Noun",
            pn: "Proper Noun",
            poss: "Possesive",
            ppos: "Postposiiton",
            per: "Personal Pronoun",
            prep: "Preposition",
            prepart: "Preposition w/ Article",
            proadv: "Pronominal Adverb",
            part: "Particle ",
            rel: "Relative Pronoun",
            trunc: "Kompositions-Erstglied",
            vpart: "Verb Particle",
            advpro: "Adverbial Interrogative Pronoun",
            pro: "Interrogative Pronoun",
            zu: "Zu for Infinitive"
        }


        function parseSyntax(text) {
            let ret = []

            const syntax_re = new RegExp(/(([a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]+?)\[(.*?)\])/gm)
            let last_idx = 0
            let match

            do {
                match = syntax_re.exec(text)

                if (match) {
                    if (match.index > last_idx) {
                        ret.push({
                            type: 'plain',
                            text: text.substring(last_idx, match.index)
                        })
                    }

                    // Handle multiple interpretations separated by |
                    const interpretations = match[3].split('|')
                    const firstInterpretation = interpretations[0]
                    const args = firstInterpretation.split(',')
                    const dict_form = args[0] || ''
                    const word_pos = args[1] || ''
                    const gender = args[2] || 'x'

                    ret.push({
                        type: 'syntax',
                        text: match[2],
                        dict_form: dict_form,
                        word_pos: word_pos,
                        gender: gender
                    })

                    last_idx = match.index + match[0].length
                }
            } while (match)

            if (last_idx < text.length) {
                ret.push({
                    type: 'plain',
                    text: text.substr(last_idx)
                })
            }

            return ret
        }

        function syntaxElementToNode(syntax_element, field_settings) {
            if (syntax_element.type !== 'syntax') {
                return document.createTextNode(syntax_element.text)
            }
            else {
                const word_container = document.createElement('span')
                word_container.classList.add('word')

                const audio_play_word = syntax_element.text
                word_container.addEventListener('click', function () {
                    pycmd('play_audio-' + audio_play_word)
                })

                const text_elem = document.createElement('span')
                text_elem.textContent = syntax_element.text
                text_elem.classList.add('word-text')

                if (field_settings.gender_coloring !== 'no') {
                    let gender_class = 'gender-'
                    if (field_settings.gender_coloring === 'hover') {
                        gender_class += 'hover-'
                    }

                    // Use green for missing/empty gender, otherwise use the actual gender
                    if (syntax_element.gender === 'x' || syntax_element.gender === '' || !syntax_element.gender) {
                        gender_class += 'missing'
                    } else {
                        gender_class += syntax_element.gender
                    }
                    text_elem.classList.add(gender_class)
                }

                // Target word highlighting will be handled after all fields are processed
                // to compare with the actual target word field content


                word_container.appendChild(text_elem)

                if (field_settings.popup === 'yes') {
                    const popup_hover_box = document.createElement('div')
                    popup_hover_box.classList.add('popup-hover-box')
                    word_container.appendChild(popup_hover_box)

                    const popup_container = document.createElement('div')
                    popup_container.classList.add('popup')
                    word_container.appendChild(popup_container)

                    const pos_gender = document.createElement('div')
                    pos_gender.classList.add('word-pos-gender')
                    popup_container.appendChild(pos_gender)

                    const pos = document.createElement('div')
                    pos.classList.add('word-pos')
                    pos.textContent = word_pos_names[syntax_element.word_pos] || ''
                    pos_gender.appendChild(pos)

                    const gender_symbol = document.createElement('div')
                    gender_symbol.classList.add('word-gender-symbol-' + syntax_element.gender);;
                    pos_gender.appendChild(gender_symbol)

                    const dict_form = document.createElement('div')
                    dict_form.classList.add('dict-form')
                    dict_form.textContent = syntax_element.dict_form
                    popup_container.appendChild(dict_form)
                }

                return word_container
            }
        }

        function syntaxToNodes(syntax, field_settings) {
            return syntax.map(function (syntax_element) {
                return syntaxElementToNode(syntax_element, field_settings)
            })
        }


        function handleFieldTextNodes(node, field_settings) {
            if (node.nodeType == Node.TEXT_NODE) {
                const text = node.textContent
                const syntax = parseSyntax(text)
                const nodes = syntaxToNodes(syntax, field_settings)
                for (const child of nodes) {
                    node.parentNode.insertBefore(child, node)
                }
                node.parentNode.removeChild(node)
            }
            else {
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                    handleFieldTextNodes(node.childNodes[i], field_settings)
                }
            }
        }

        function handleField(field) {
            const field_settings = {
                popup: field.getAttribute('data-popup') || 'no',
                gender_coloring: field.getAttribute('data-gender-coloring') || 'no',
                field_element: field
            }

            handleFieldTextNodes(field, field_settings)
        }

        function getTargetWordText() {
            const targetWordField = document.querySelector('[data-field-type="target-word"]')
            if (!targetWordField) return null

            // Get the plain text content without syntax markup
            const text = targetWordField.textContent || targetWordField.innerText || ''
            return text.replace(/\[(.*?)\]/g, '').trim()
        }

        function markTargetWordsInSentence() {
            const targetWordText = getTargetWordText()
            if (!targetWordText) return

            const sentenceFields = document.querySelectorAll('.field:not([data-field-type="target-word"])')

            sentenceFields.forEach(field => {
                const words = field.querySelectorAll('.word')
                words.forEach(word => {
                    const wordText = word.querySelector('.word-text')
                    if (wordText && wordText.textContent.toLowerCase() === targetWordText.toLowerCase()) {
                        wordText.classList.add('target-word-highlight')
                    }
                })
            })
        }




        const fields = document.querySelectorAll('.field')

        for (field of fields) {
            handleField(field)
        }

        // Mark target words after all fields are processed
        markTargetWordsInSentence()

        function closeAllActive() {
            const current_popups = document.querySelectorAll('.active')
            for (const popup of current_popups) {
                popup.classList.remove('active', 'popup-active')
            }
        }

        function activeEnablePopup(elem) {
            const popup_elem = elem.querySelector('.popup')
            if (!popup_elem) {
                return
            }

            elem.classList.add('popup-active')

            function isTooHigh() {
                return popup_elem.getBoundingClientRect().top < 0
            }

            function isTooLow() {
                return popup_elem.getBoundingClientRect().bottom >= (window.innerHeight || document.documentElement.clientHeight)
            }

            function isTooRight() {
                return popup_elem.getBoundingClientRect().right >= (window.innerWidth || document.documentElement.clientWidth)
            }

            function isTooLeft() {
                return popup_elem.getBoundingClientRect().left < 0
            }

            elem.classList.remove('popup-direction-u', 'popup-direction-d', 'popup-direction-l', 'popup-direction-r')

            elem.classList.add('popup-direction-u')
            if (!isTooHigh()) {
                return
            }
            elem.classList.remove('popup-direction-u')

            elem.classList.add('popup-direction-d')
            if (!isTooLow()) {
                return
            }
            elem.classList.remove('popup-direction-d')

            elem.classList.add('popup-direction-l')
            if (!isTooLeft()) {
                return
            }
            elem.classList.remove('popup-direction-l')

            elem.classList.add('popup-direction-r')
            if (!isTooRight()) {
                return
            }
            elem.classList.remove('popup-direction-r')

            elem.classList.add('popup-direction-u')
        }

        function on_activeEnter() {
            const was_active = this.classList.contains('active')
            closeAllActive()
            if (was_active) {
                return
            }
            this.classList.add('active')
            activeEnablePopup(this)
        }

        function on_activeLeave() {
            this.classList.remove('active', 'popup-active')
        }

        function on_activeToggle() {
            if (this.classList.contains('active')) {
                this.classList.remove('active', 'popup-active')
            } else {
                closeAllActive()
                this.classList.add('active')
                activeEnablePopup(this)
            }
        }

        const word_elements = document.querySelectorAll('.word')
        const is_mobile = typeof (pycmd) === typeof (undefined)
        for (elem of word_elements) {
            if (is_mobile) {
                elem.addEventListener('click', on_activeToggle)
                elem.classList.add('tappable')
            } else {
                elem.addEventListener('mouseenter', on_activeEnter)
                elem.addEventListener('mouseleave', on_activeLeave)
            }
        }
    }());

    // Add copyright
    (function() {
        const cards = document.querySelectorAll('.migaku-card');
        cards.forEach(function(card) {
            const copyright = document.createElement('div');
            copyright.className = 'migaku-copyright';
            copyright.textContent = '© Meltastic';
            card.appendChild(copyright);
        });
    })();
</script>
<!--###MIGAKU GERMAN SUPPORT JS ENDS###-->
