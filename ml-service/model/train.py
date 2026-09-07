"""
Trains the Strix CNN using transfer learning on MobileNetV2.

Expected dataset layout (create this under ml-service/data/):

    data/
      train/
        pothole/            *.jpg
        streetlight/        *.jpg
        water_leakage/      *.jpg
        garbage/             *.jpg
        construction_hazard/*.jpg
      val/
        pothole/ ...
        streetlight/ ...
        water_leakage/ ...
        garbage/ ...
        construction_hazard/ ...

Aim for at least ~50-100 images per category to start (more is better).
Good free sources: Kaggle ("pothole detection", "garbage classification"
datasets), Roboflow Universe, or your own phone photos of your city.

Usage:
    cd ml-service
    pip install -r requirements.txt
    python model/train.py --epochs 15
"""

import argparse
import json
import os

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
CATEGORIES_PATH = os.path.join(BASE_DIR, "categories.json")
MODEL_OUT_PATH = os.path.join(BASE_DIR, "strix_cnn.h5")
IMG_SIZE = (224, 224)


def build_model(num_classes: int, fine_tune: bool = False):
    base = MobileNetV2(input_shape=(*IMG_SIZE, 3), include_top=False, weights="imagenet")
    base.trainable = fine_tune

    model = models.Sequential(
        [
            base,
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.3),
            layers.Dense(128, activation="relu"),
            layers.Dropout(0.2),
            layers.Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4 if fine_tune else 1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--fine-tune", action="store_true", help="Unfreeze base model for a second fine-tuning pass")
    args = parser.parse_args()

    train_dir = os.path.join(DATA_DIR, "train")
    val_dir = os.path.join(DATA_DIR, "val")

    if not os.path.isdir(train_dir) or not os.path.isdir(val_dir):
        raise SystemExit(
            f"Expected data at {train_dir} and {val_dir}.\n"
            "Create ml-service/data/train/<category>/*.jpg and ml-service/data/val/<category>/*.jpg "
            "for each category listed in model/categories.json, then re-run this script."
        )

    with open(CATEGORIES_PATH) as f:
        categories = json.load(f)["categories"]

    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        zoom_range=0.15,
        horizontal_flip=True,
    )
    val_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        train_dir, target_size=IMG_SIZE, batch_size=args.batch_size, classes=categories, class_mode="categorical"
    )
    val_gen = val_datagen.flow_from_directory(
        val_dir, target_size=IMG_SIZE, batch_size=args.batch_size, classes=categories, class_mode="categorical"
    )

    print(f"[train] Classes (index order matters - must match categories.json): {train_gen.class_indices}")

    model = build_model(num_classes=len(categories), fine_tune=args.fine_tune)
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint(MODEL_OUT_PATH, monitor="val_accuracy", save_best_only=True),
    ]

    model.fit(train_gen, validation_data=val_gen, epochs=args.epochs, callbacks=callbacks)

    model.save(MODEL_OUT_PATH)
    print(f"[train] Saved model to {MODEL_OUT_PATH}")
    print("[train] Restart app.py - it will auto-detect and load this model on startup.")


if __name__ == "__main__":
    main()
