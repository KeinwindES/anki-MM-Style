<div class="migaku-card migaku-card-front">
    <div class="migaku-card-content">
        <!-- Hidden field reference to satisfy Anki's template requirements -->
        <div style="display: none;">{{Target Word}}</div>

        {{^Is Audio Card}}
            {{^Is Vocabulary Card}}
                <div class="field" data-popup="yes" data-gender-coloring="yes">{{editable:Sentence}}</div>
            {{/Is Vocabulary Card}}
        {{/Is Audio Card}}
        {{^Is Audio Card}}
            {{#Is Vocabulary Card}}
                <div class="field" data-popup="yes" data-gender-coloring="yes" data-field-type="target-word">{{editable:Target Word}}</div>
            {{/Is Vocabulary Card}}
        {{/Is Audio Card}}
        {{#Is Audio Card}}
            {{^Is Vocabulary Card}}
                {{editable:Sentence Audio}}
            {{/Is Vocabulary Card}}
        {{/Is Audio Card}}
        {{#Is Audio Card}}
            {{#Is Vocabulary Card}}
                {{editable:Word Audio}}
            {{/Is Vocabulary Card}}
        {{/Is Audio Card}}
    </div>
</div>

<!--###MIGAKU GERMAN SUPPORT JS STARTS###--><script>

    (function () {
        // ========================================
        // CONSTANTS AND CONFIGURATION
        // ========================================

        // Maps part-of-speech abbreviations to full names
        const PART_OF_SPEECH_NAMES = {
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

        // Regular expression to match syntax pattern: word[dict_form,pos,gender]
        const SYNTAX_REGEX = /(([a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]+?)\[(.*?)\])/gm


        // ========================================
        // PARSING FUNCTIONS
        // ========================================

        /**
         * Parses text containing syntax markers and returns structured data
         * Example: "Das[das,art,n] ist[sein,v,] gut[gut,adj,]"
         * @param {string} text - Text containing syntax markers
         * @returns {Array} Array of parsed elements with type and properties
         */
        function parseSyntax(text) {
            const parsedElements = []
            let lastIndex = 0
            let match

            do {
                match = SYNTAX_REGEX.exec(text)

                if (match) {
                    // Add any plain text before the syntax match
                    if (match.index > lastIndex) {
                        parsedElements.push({
                            type: 'plain',
                            text: text.substring(lastIndex, match.index)
                        })
                    }

                    // Parse syntax content - handle multiple entries separated by |
                    const syntaxContent = match[3]
                    const firstEntry = syntaxContent.split('|')[0] // Take first entry if multiple
                    const entryParts = firstEntry.split(',')

                    const dictionaryForm = entryParts[0] || ''
                    const partOfSpeech = entryParts[1] || ''
                    const gender = entryParts[2] || 'x'

                    parsedElements.push({
                        type: 'syntax',
                        text: match[2],                // The actual word
                        dict_form: dictionaryForm,     // Dictionary/base form
                        word_pos: partOfSpeech,        // Part of speech
                        gender: gender                 // Gender (m/f/n/x)
                    })

                    lastIndex = match.index + match[0].length
                }
            } while (match)

            // Add any remaining plain text
            if (lastIndex < text.length) {
                parsedElements.push({
                    type: 'plain',
                    text: text.substr(lastIndex)
                })
            }

            return parsedElements
        }

        /**
         * Creates a DOM node from a parsed syntax element
         * @param {Object} syntaxElement - Parsed syntax element
         * @param {Object} fieldSettings - Field configuration settings
         * @returns {Node} DOM node representing the element
         */
        function createNodeFromSyntaxElement(syntaxElement, fieldSettings) {
            // Handle plain text elements
            if (syntaxElement.type !== 'syntax') {
                return document.createTextNode(syntaxElement.text)
            }

            // Create word container with click handler for audio
            const wordContainer = document.createElement('span')
            wordContainer.classList.add('word')
            wordContainer.addEventListener('click', function () {
                pycmd('play_audio-' + syntaxElement.text)
            })

            // Create text element for the word
            const textElement = document.createElement('span')
            textElement.textContent = syntaxElement.text
            textElement.classList.add('word-text')

            // Apply gender coloring if enabled
            applyGenderColoring(textElement, syntaxElement, fieldSettings)

            // Apply target word highlighting if this word matches the target
            applyTargetWordHighlighting(textElement, syntaxElement)

            wordContainer.appendChild(textElement)

            // Create popup if enabled
            if (fieldSettings.popup === 'yes') {
                createPopup(wordContainer, syntaxElement)
            }

            return wordContainer
        }

        /**
         * Applies gender-based coloring to a text element
         * @param {HTMLElement} textElement - The text element to style
         * @param {Object} syntaxElement - Parsed syntax element
         * @param {Object} fieldSettings - Field configuration settings
         */
        function applyGenderColoring(textElement, syntaxElement, fieldSettings) {
            if (fieldSettings.gender_coloring === 'no') {
                return
            }

            let genderClass = 'gender-'

            // Add hover prefix if hover mode is enabled
            if (fieldSettings.gender_coloring === 'hover') {
                genderClass += 'hover-'
            }

            // Determine gender class suffix
            const hasGender = syntaxElement.gender &&
                             syntaxElement.gender !== 'x' &&
                             syntaxElement.gender !== ''

            if (hasGender) {
                genderClass += syntaxElement.gender
            } else {
                genderClass += 'missing'
            }

            textElement.classList.add(genderClass)
        }

        /**
         * Applies target word highlighting if the word matches the target
         * @param {HTMLElement} textElement - The text element to potentially highlight
         * @param {Object} syntaxElement - Parsed syntax element
         */
        function applyTargetWordHighlighting(textElement, syntaxElement) {
            const targetWordField = document.querySelector('.migaku-card [data-field-type="target-word"]')
            if (!targetWordField) {
                return
            }

            const targetWord = targetWordField.textContent.trim().toLowerCase()
            const currentWord = syntaxElement.text.toLowerCase()
            const dictionaryForm = syntaxElement.dict_form ? syntaxElement.dict_form.toLowerCase() : ''

            // Highlight if current word or dictionary form matches target
            if (currentWord === targetWord || dictionaryForm === targetWord) {
                textElement.classList.add('target-word-highlight')
            }
        }

        /**
         * Creates a popup with word information
         * @param {HTMLElement} wordContainer - Container to add popup to
         * @param {Object} syntaxElement - Parsed syntax element
         */
        function createPopup(wordContainer, syntaxElement) {
            // Create hover box for popup positioning
            const hoverBox = document.createElement('div')
            hoverBox.classList.add('popup-hover-box')
            wordContainer.appendChild(hoverBox)

            // Create popup container
            const popupContainer = document.createElement('div')
            popupContainer.classList.add('popup')
            wordContainer.appendChild(popupContainer)

            // Create part of speech and gender section
            const posGenderSection = document.createElement('div')
            posGenderSection.classList.add('word-pos-gender')
            popupContainer.appendChild(posGenderSection)

            // Add part of speech
            const posElement = document.createElement('div')
            posElement.classList.add('word-pos')
            posElement.textContent = PART_OF_SPEECH_NAMES[syntaxElement.word_pos] || ''
            posGenderSection.appendChild(posElement)

            // Add gender symbol
            const genderSymbol = document.createElement('div')
            genderSymbol.classList.add('word-gender-symbol-' + syntaxElement.gender)
            posGenderSection.appendChild(genderSymbol)

            // Add dictionary form
            const dictFormElement = document.createElement('div')
            dictFormElement.classList.add('dict-form')
            dictFormElement.textContent = syntaxElement.dict_form
            popupContainer.appendChild(dictFormElement)
        }

        /**
         * Converts array of parsed syntax elements to DOM nodes
         * @param {Array} parsedSyntax - Array of parsed syntax elements
         * @param {Object} fieldSettings - Field configuration settings
         * @returns {Array} Array of DOM nodes
         */
        function convertSyntaxToNodes(parsedSyntax, fieldSettings) {
            return parsedSyntax.map(function (syntaxElement) {
                return createNodeFromSyntaxElement(syntaxElement, fieldSettings)
            })
        }


        /**
         * Recursively processes text nodes in a field to apply syntax parsing
         * @param {Node} node - DOM node to process
         * @param {Object} fieldSettings - Field configuration settings
         */
        function processFieldTextNodes(node, fieldSettings) {
            if (node.nodeType === Node.TEXT_NODE) {
                // Parse the text content and convert to enhanced nodes
                const textContent = node.textContent
                const parsedSyntax = parseSyntax(textContent)
                const enhancedNodes = convertSyntaxToNodes(parsedSyntax, fieldSettings)

                // Replace the original text node with enhanced nodes
                for (const enhancedNode of enhancedNodes) {
                    node.parentNode.insertBefore(enhancedNode, node)
                }
                node.parentNode.removeChild(node)
            } else {
                // Process child nodes recursively (in reverse order to handle DOM changes)
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                    processFieldTextNodes(node.childNodes[i], fieldSettings)
                }
            }
        }

        /**
         * Processes a field element to apply syntax enhancements
         * @param {HTMLElement} fieldElement - The field element to process
         */
        function processField(fieldElement) {
            const fieldSettings = {
                popup: fieldElement.getAttribute('data-popup') || 'no',
                gender_coloring: fieldElement.getAttribute('data-gender-coloring') || 'no',
                field_element: fieldElement
            }

            processFieldTextNodes(fieldElement, fieldSettings)
        }


        // ========================================
        // FIELD PROCESSING
        // ========================================

        // Process all fields with syntax enhancements
        const allFields = document.querySelectorAll('.field')
        for (const field of allFields) {
            processField(field)
        }


        // ========================================
        // POPUP INTERACTION HANDLERS
        // ========================================

        /**
         * Closes all currently active popups
         */
        function closeAllActivePopups() {
            const activePopups = document.querySelectorAll('.active')
            for (const popup of activePopups) {
                popup.classList.remove('active', 'popup-active')
            }
        }

        /**
         * Enables and positions a popup to avoid screen boundaries
         * @param {HTMLElement} wordElement - The word element containing the popup
         */
        function enableAndPositionPopup(wordElement) {
            const popupElement = wordElement.querySelector('.popup')
            if (!popupElement) {
                return
            }

            wordElement.classList.add('popup-active')

            // Helper functions to check if popup would overflow screen boundaries
            const popupBounds = popupElement.getBoundingClientRect()
            const screenWidth = window.innerWidth || document.documentElement.clientWidth
            const screenHeight = window.innerHeight || document.documentElement.clientHeight

            const wouldOverflowTop = () => popupBounds.top < 0
            const wouldOverflowBottom = () => popupBounds.bottom >= screenHeight
            const wouldOverflowLeft = () => popupBounds.left < 0
            const wouldOverflowRight = () => popupBounds.right >= screenWidth

            // Remove all direction classes before testing
            const directionClasses = ['popup-direction-u', 'popup-direction-d', 'popup-direction-l', 'popup-direction-r']
            wordElement.classList.remove(...directionClasses)

            // Try positioning popup above (up) first
            wordElement.classList.add('popup-direction-u')
            if (!wouldOverflowTop()) return

            // Try positioning popup below (down)
            wordElement.classList.remove('popup-direction-u')
            wordElement.classList.add('popup-direction-d')
            if (!wouldOverflowBottom()) return

            // Try positioning popup to the left
            wordElement.classList.remove('popup-direction-d')
            wordElement.classList.add('popup-direction-l')
            if (!wouldOverflowLeft()) return

            // Try positioning popup to the right
            wordElement.classList.remove('popup-direction-l')
            wordElement.classList.add('popup-direction-r')
            if (!wouldOverflowRight()) return

            // Default to up if all positions would overflow
            wordElement.classList.remove('popup-direction-r')
            wordElement.classList.add('popup-direction-u')
        }

        /**
         * Handles mouse enter events for desktop popup interaction
         */
        function handleMouseEnter() {
            const wasAlreadyActive = this.classList.contains('active')
            closeAllActivePopups()

            if (wasAlreadyActive) {
                return // Don't reopen if it was already active
            }

            this.classList.add('active')
            enableAndPositionPopup(this)
        }

        /**
         * Handles mouse leave events for desktop popup interaction
         */
        function handleMouseLeave() {
            this.classList.remove('active', 'popup-active')
        }

        /**
         * Handles tap/click events for mobile popup interaction
         */
        function handleTapToggle() {
            const isCurrentlyActive = this.classList.contains('active')

            if (isCurrentlyActive) {
                this.classList.remove('active', 'popup-active')
            } else {
                closeAllActivePopups()
                this.classList.add('active')
                enableAndPositionPopup(this)
            }
        }

        // ========================================
        // EVENT LISTENER SETUP
        // ========================================

        // Set up interaction handlers for all word elements
        const wordElements = document.querySelectorAll('.word')
        const isMobileDevice = typeof (pycmd) === typeof (undefined)

        for (const wordElement of wordElements) {
            if (isMobileDevice) {
                // Mobile: use tap to toggle popups
                wordElement.addEventListener('click', handleTapToggle)
                wordElement.classList.add('tappable')
            } else {
                // Desktop: use hover to show popups
                wordElement.addEventListener('mouseenter', handleMouseEnter)
                wordElement.addEventListener('mouseleave', handleMouseLeave)
            }
        }
    }());

        // ========================================
        // COPYRIGHT NOTICE
        // ========================================

        // Add copyright notice to all cards
        const allCards = document.querySelectorAll('.migaku-card')
        allCards.forEach(function(card) {
            const copyrightNotice = document.createElement('div')
            copyrightNotice.className = 'migaku-copyright'
            copyrightNotice.textContent = '© Meltastic'
            card.appendChild(copyrightNotice)
        })

    }()) // End of main function
</script>
<!--###MIGAKU GERMAN SUPPORT JS ENDS###-->
