import * as config from "trix/config"
import { ZERO_WIDTH_SPACE } from "trix/constants"
import { copyObject, makeElement } from "trix/core/helpers"
import ObjectView from "trix/views/object_view"
import HTMLSanitizer from "trix/models/html_sanitizer"

const { css } = config

export default class AttachmentView extends ObjectView {
  constructor() {
    super(...arguments)
    this.attachment = this.object
    this.attachment.uploadProgressDelegate = this
    this.attachmentPiece = this.options.piece
  }

  createContentNodes() {
    return []
  }

  createNodes() {
    let innerElement
    const figure = innerElement = makeElement({
      tagName: "figure",
      className: this.getClassName(),
      data: this.getData(),
      editable: false,
    })


    if (this.attachment.hasContent()) {
      HTMLSanitizer.setHTML(innerElement, this.attachment.getContent())
    } else {
      this.createContentNodes().forEach((node) => {
        innerElement.appendChild(node)
      })
    }

    return [ createCursorTarget("left"), figure, createCursorTarget("right") ]
  }

  getClassName() {
    const names = [ css.attachment, `${css.attachment}--${this.attachment.getType()}` ]
    const extension = this.attachment.getExtension()
    if (extension) {
      names.push(`${css.attachment}--${extension}`)
    }
    names.push("w-fit")
    return names.join(" ")
  }

  getData() {
    const data = {
      trixAttachment: JSON.stringify(this.attachment),
      trixContentType: this.attachment.getContentType(),
      trixId: this.attachment.id,
    }

    const { attributes } = this.attachmentPiece
    if (!attributes.isEmpty()) {
      data.trixAttributes = JSON.stringify(attributes)
    }

    if (this.attachment.isPending()) {
      data.trixSerialize = false
    }

    return data
  }

  getHref() {
    if (!htmlContainsTagName(this.attachment.getContent(), "a")) {
      return this.attachment.getHref()
    }
  }

  getCaptionConfig() {
    const type = this.attachment.getType()
    const captionConfig = copyObject(config.attachments[type]?.caption)
    if (type === "file") {
      captionConfig.name = true
    }
    return captionConfig
  }

  findProgressElement() {
    return this.findElement()?.querySelector("progress")
  }

  // Attachment delegate

  attachmentDidChangeUploadProgress() {
    const value = this.attachment.getUploadProgress()
    const progressElement = this.findProgressElement()
    if (progressElement) {
      progressElement.value = value
    }
  }
}

const createCursorTarget = (name) =>
  makeElement({
    tagName: "span",
    textContent: ZERO_WIDTH_SPACE,
    data: {
      trixCursorTarget: name,
      trixSerialize: false,
    },
  })

const htmlContainsTagName = function(html, tagName) {
  const div = makeElement("div")
  HTMLSanitizer.setHTML(div, html || "")
  return div.querySelector(tagName)
}
