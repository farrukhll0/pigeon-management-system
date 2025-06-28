const mongoose = require('mongoose');

const raceResultSchema = new mongoose.Schema({
    date: Date,
    location: String,
    distance: Number,
    position: Number,
    speed: Number
}, { _id: false });

const vaccinationSchema = new mongoose.Schema({
    type: String,
    date: Date,
    notes: String
}, { _id: false });

const pigeonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Pigeon name is required'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    ringNumber: {
        type: String,
        trim: true,
        maxlength: [50, 'Ring number cannot be more than 50 characters']
    },
    dateOfBirth: Date,
    color: {
        type: String,
        trim: true,
        maxlength: [50, 'Color cannot be more than 50 characters']
    },
    sex: {
        type: String,
        enum: ['Male', 'Female', 'Unknown'],
        default: 'Unknown'
    },
    strain: {
        type: String,
        trim: true,
        maxlength: [100, 'Strain cannot be more than 100 characters']
    },
    breeder: {
        type: String,
        trim: true,
        maxlength: [100, 'Breeder cannot be more than 100 characters']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot be more than 1000 characters']
    },
    achievements: [String],
    raceResults: [raceResultSchema],
    vaccinations: [vaccinationSchema],
    images: [String], // Gallery
    fatherName: {
        type: String,
        trim: true,
        maxlength: [100, 'Father name cannot be more than 100 characters']
    },
    motherName: {
        type: String,
        trim: true,
        maxlength: [100, 'Mother name cannot be more than 100 characters']
    },
    pigeonImage: {
        type: String,
        default: ''
    },
    fatherImage: {
        type: String,
        default: ''
    },
    motherImage: {
        type: String,
        default: ''
    },
    pedigree: {
        greatGreatGrandfather: {
            name: { type: String, trim: true, maxlength: [100, 'Name cannot be more than 100 characters'] },
            image: { type: String, default: '' }
        },
        greatGreatGrandmother: {
            name: { type: String, trim: true, maxlength: [100, 'Name cannot be more than 100 characters'] },
            image: { type: String, default: '' }
        },
        greatGrandfather: {
            name: { type: String, trim: true, maxlength: [100, 'Name cannot be more than 100 characters'] },
            image: { type: String, default: '' }
        },
        greatGrandmother: {
            name: { type: String, trim: true, maxlength: [100, 'Name cannot be more than 100 characters'] },
            image: { type: String, default: '' }
        },
        grandfather: {
            name: { type: String, trim: true, maxlength: [100, 'Name cannot be more than 100 characters'] },
            image: { type: String, default: '' }
        },
        grandmother: {
            name: { type: String, trim: true, maxlength: [100, 'Name cannot be more than 100 characters'] },
            image: { type: String, default: '' }
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for better query performance
pigeonSchema.index({ user: 1, name: 1 });
pigeonSchema.index({ user: 1, strain: 1 });

module.exports = mongoose.model('Pigeon', pigeonSchema); 