'use strict';

/**
 * The Polymerase enzyme in real life assembles a new DNA strand on top of the existing one. During the process, it
 * check for replication errors doing proof-reading on the fly. But sometimes a random mutation occur... that's life
 * trying to evolve.
 * This module takes the primer feature instructions, does proof-reading over them to make sure no errors
 * are found and then it assembles a collection of resolved feature toggles.
 *
 * In the process, even if the instructions are considered valid, random mutations occur. Those are caused by the
 * Bucket and Throttle mutators. That's your application trying to evolve.
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function (require) {
    var bucketMutator = require('./../mutators/bucket');
    var throttleMutator = require('./../mutators/throttle');
    var proofReader = require('./../reactions/proof-reading');

    return {
        /**
         * Returns a resolved feature toggle, with the information indicating whether it's active or not. If the
         * feature mutates to a bucket, it also can contain the corresponding feature toggle.
         *
         * @param featureName The feature name being processed
         * @param primerInstructions The primer instructions to process
         * @returns A resolved feature toggle, which may mutate to a bucket feature toggle
         */
        assembleFeatures: function(featureName, primerInstructions) {
            var features = {};

            if (proofReader.areInstructionsValid(primerInstructions)) {
                var toggle = processFeatureInstructions(primerInstructions);
                addToFeatures(features, featureName, toggle);

                if (containsBuckets(toggle, primerInstructions)) {
                    addBucketToFeatures(features, featureName, primerInstructions, toggle);
                }
            } else {
                console.log('There are invalid feature instructions!');
                addToFeatures(features, featureName, false);
            }
            return features;
        }
    };

    function addToFeatures(features, featureName, toggle) {
        features[featureName] = toggle;
    }

    function processFeatureInstructions(featureProperties) {
        var toggle = false;

        if (featureProperties.toggle !== false) {
            if (throttleMutator.isThrottleValid(featureProperties.throttle)) {
                toggle = throttleMutator.mutate(featureProperties.throttle);
            } else if (featureProperties.toggle === true) {
                toggle = true;
            }
        }

        return toggle;
    }

    function containsBuckets(toggle, featureInstructions) {
        return toggle && bucketMutator.containsMultivariant(featureInstructions);
    }

    function addBucketToFeatures(features, featureName, featureInstructions, toggle) {
        var bucketName = bucketMutator.mutate(featureInstructions);
        addToFeatures(features, featureName + "." + bucketName, toggle);
    }
});