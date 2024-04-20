/*
 * Copyright (c) 2022 MKLabs. All rights reserved.
 *
 * NOTICE:  All information contained herein is, and remains the
 * property of MKLabs. The intellectual and technical concepts
 * contained herein are proprietary to MKLabs and may be covered
 * by Republic of Korea and Foreign Patents, patents in process,
 * and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from MKLabs (niklaus.lee@gmail.com).
 */

import * as geometry from "../graphics/geometry";
import { Editor, Handler } from "../editor";
import { CanvasPointerEvent } from "../graphics/graphics";
import { Cursor, Mouse } from "../graphics/const";
import { Frame, Shape } from "../shapes";
import { addShape, resolveAllConstraints } from "../mutates";

/**
 * Frame Factory Handler
 */
export class FrameFactoryHandler extends Handler {
  dragging: boolean = false;
  dragStartPoint: number[] = [-1, -1];
  dragPoint: number[] = [-1, -1];
  shape: Frame | null = null;

  reset(): void {
    this.dragging = false;
    this.dragStartPoint = [-1, -1];
    this.dragPoint = [-1, -1];
    this.shape = null;
  }

  initialize(editor: Editor, e: CanvasPointerEvent): void {
    const page = editor.currentPage;
    if (page) {
      this.shape = editor.factory.createFrame([
        this.dragStartPoint,
        this.dragPoint,
      ]);
      editor.history.startAction("create");
      editor.store.transact((tx) => {
        addShape(tx, this.shape!, page);
      });
    }
  }

  update(editor: Editor, e: CanvasPointerEvent): void {
    const page = editor.currentPage;
    if (page && this.shape) {
      const rect = geometry.normalizeRect([
        this.dragStartPoint,
        this.dragPoint,
      ]);
      editor.store.transact((tx) => {
        tx.assign(this.shape!, "left", rect[0][0]);
        tx.assign(this.shape!, "top", rect[0][1]);
        tx.assign(this.shape!, "width", geometry.width(rect));
        tx.assign(this.shape!, "height", geometry.height(rect));
        resolveAllConstraints(tx, page, editor.canvas);
      });
    }
  }

  finalize(editor: Editor, e: CanvasPointerEvent): void {
    const MIN_SIZE = 2;
    if (
      this.shape &&
      this.shape?.width < MIN_SIZE &&
      this.shape?.height < MIN_SIZE
    ) {
      editor.history.cancelAction();
    } else {
      editor.history.endAction();
      editor.factory.triggerCreate(this.shape as Shape);
    }
  }

  /**
   * pointerDown
   * @override
   */
  pointerDown(editor: Editor, e: CanvasPointerEvent) {
    if (e.button === Mouse.BUTTON1) {
      const canvas = editor.canvas;
      this.dragging = true;
      this.dragStartPoint = canvas.globalCoordTransformRev([e.x, e.y]);
      this.dragPoint = geometry.copy(this.dragStartPoint);
      this.initialize(editor, e);
      editor.repaint();
    }
  }

  /**
   * pointerMove
   * @override
   */
  pointerMove(editor: Editor, e: CanvasPointerEvent) {
    editor.repaint();
    if (this.dragging) {
      const canvas = editor.canvas;
      this.dragPoint = canvas.globalCoordTransformRev([e.x, e.y]);
      this.update(editor, e);
      editor.repaint();
    } else {
      editor.repaint();
    }
  }

  /**
   * pointerUp
   * @override
   */
  pointerUp(editor: Editor, e: CanvasPointerEvent) {
    if (e.button === Mouse.BUTTON1 && this.dragging) {
      this.finalize(editor, e);
      editor.repaint();
      this.reset();
      this.done(editor);
    }
  }

  keyDown(editor: Editor, e: KeyboardEvent): boolean {
    if (e.key === "Escape" && this.dragging) {
      editor.history.cancelAction();
      editor.repaint();
      this.reset();
      this.done(editor);
    }
    return false;
  }

  onActivate(editor: Editor): void {
    editor.setCursor(Cursor.CROSSHAIR);
  }

  onDeactivate(editor: Editor): void {
    editor.setCursor(Cursor.DEFAULT);
  }
}
