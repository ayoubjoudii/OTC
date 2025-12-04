

/**
 * Classe abstraite représentant un employé.
 */
public abstract class Employe {
    private String cin;
    private String nom;
    private String prenom;
    private int dateEmbauche;
    private double salaireBase; 
    public Equipe sonEquipe;

    public Employe(String cin, String nom, String prenom, LocalDate dateEmbauche, double salaireBase) {
        this.cin = cin;
        this.nom = nom;
        this.prenom = prenom;
        this.dateEmbauche = dateEmbauche;
        this.salaireBase = salaireBase;
    }
//getters
    public String getCin() { return cin; }
    public String getNom() { return nom; }
    public String getPrenom() { return prenom; }
    public LocalDate getDateEmbauche() { return dateEmbauche; }
    public double getSalaireBase() { return salaireBase; }
//setters
    public void setCin() { this.cin=cin; }
    public void setNom() { this.nom=nom; }
    public void setPrenom() { this.prenom=prenom; }
    public void setDateEmbauche() { this.dateEmbauche=dateEmbauche; }
    public void setSalaireBase() { this.salaireBase=salaireBase; }

    public abstract double calculerSalaire();

    @Override
    public String toString() {
       
        return "Cin : "+cin+"Prenom :"+ prenom+"Nom : " +nom+"date d'embauche : "+dateEmbauche+"Salaire de base : "+salaireBase;
    }
}

